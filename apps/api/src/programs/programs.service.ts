import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth.decorators.js';
import { Prisma, ProgramStatus } from '../generated/prisma/client.js';
import { PatientsService } from '../patients/patients.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RoutineExerciseDto } from './dto/routine-exercise.dto.js';
import { RoutineDto } from './dto/routine.dto.js';
import { SaveProgramDto } from './dto/save-program.dto.js';

/** What every program response includes: routines in order, each with its exercises in order */
const programInclude = {
  routines: {
    orderBy: { order: 'asc' },
    include: {
      exercises: {
        orderBy: { order: 'asc' },
        include: {
          exercise: {
            select: { id: true, name: true, goal: true, level: true },
          },
        },
      },
    },
  },
} satisfies Prisma.ProgramInclude;

@Injectable()
export class ProgramsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly patientsService: PatientsService,
  ) {}

  /** A patient's programs: the active one first, then the history (newest first) */
  async findForPatient(user: AuthUser, patientId: string) {
    await this.patientsService.findOne(user, patientId); // 404 if not visible
    return this.prisma.program.findMany({
      where: { patientId },
      include: programInclude,
      orderBy: [
        { status: 'asc' },
        { startDate: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(user: AuthUser, id: string) {
    const program = await this.prisma.program.findFirst({
      // Visible only if its patient is visible to this user
      where: { id, patient: this.patientsService.visibleTo(user) },
      include: programInclude,
    });
    if (!program) throw new NotFoundException(`Program ${id} not found`);
    return program;
  }

  /** Assigns a new program. The patient's current active program (if any) is ended. */
  async create(user: AuthUser, patientId: string, dto: SaveProgramDto) {
    const patient = await this.patientsService.findOne(user, patientId);
    if (patient.dischargedAt) {
      throw new ConflictException(
        "Cannot assign a program: the patient's follow-up has ended",
      );
    }
    await this.validateContent(dto.routines);

    const [, program] = await this.prisma.$transaction([
      this.prisma.program.updateMany({
        where: { patientId, status: ProgramStatus.ACTIVE },
        data: { status: ProgramStatus.ENDED, endDate: new Date() },
      }),
      this.prisma.program.create({
        data: {
          patientId,
          ...programData(dto),
          routines: {
            create: dto.routines.map((routine, index) => ({
              ...routineData(routine, index),
              exercises: { create: routine.exercises.map(lineData) },
            })),
          },
        },
        include: programInclude,
      }),
    ]);
    return program;
  }

  /**
   * Replaces the program's content. Routines and lines are updated in place (by id)
   * rather than deleted and recreated, so future workout logs can keep pointing to them.
   */
  async update(user: AuthUser, id: string, dto: SaveProgramDto) {
    const program = await this.findOne(user, id);
    if (program.status === ProgramStatus.ENDED) {
      throw new ConflictException('Ended programs cannot be edited');
    }
    await this.validateContent(dto.routines);
    this.checkIdsBelongToProgram(program.routines, dto.routines);

    const keptRoutineIds = dto.routines.flatMap((r) => (r.id ? [r.id] : []));

    await this.prisma.$transaction(async (tx) => {
      // Routines no longer in the list (their exercises go with them)
      await tx.routine.deleteMany({
        where: { programId: id, id: { notIn: keptRoutineIds } },
      });

      for (const [index, routine] of dto.routines.entries()) {
        if (!routine.id) {
          await tx.routine.create({
            data: {
              ...routineData(routine, index),
              programId: id,
              exercises: { create: routine.exercises.map(lineData) },
            },
          });
          continue;
        }

        await tx.routine.update({
          where: { id: routine.id },
          data: routineData(routine, index),
        });
        const keptLineIds = routine.exercises.flatMap((l) =>
          l.id ? [l.id] : [],
        );
        await tx.routineExercise.deleteMany({
          where: { routineId: routine.id, id: { notIn: keptLineIds } },
        });
        for (const [lineIndex, line] of routine.exercises.entries()) {
          if (line.id) {
            await tx.routineExercise.update({
              where: { id: line.id },
              data: lineData(line, lineIndex),
            });
          } else {
            await tx.routineExercise.create({
              data: { ...lineData(line, lineIndex), routineId: routine.id },
            });
          }
        }
      }

      await tx.program.update({ where: { id }, data: programData(dto) });
    });
    return this.findOne(user, id);
  }

  /** Ends an active program. It stays in the patient's history, read-only. */
  async end(user: AuthUser, id: string) {
    const program = await this.findOne(user, id);
    if (program.status === ProgramStatus.ENDED) return program;

    await this.prisma.program.update({
      where: { id },
      data: { status: ProgramStatus.ENDED, endDate: new Date() },
    });
    return this.findOne(user, id);
  }

  /**
   * Checks what class-validator can't: no day in two routines, reps XOR duration,
   * and that every exercise exists.
   */
  private async validateContent(routines: RoutineDto[]) {
    const seenDays = new Set<string>();
    for (const routine of routines) {
      for (const day of routine.daysOfWeek) {
        if (seenDays.has(day)) {
          throw new BadRequestException(
            `${day} appears in more than one routine`,
          );
        }
        seenDays.add(day);
      }
    }

    routines.forEach((routine, r) =>
      routine.exercises.forEach((line, l) => {
        const hasReps = line.reps !== undefined && line.reps !== null;
        const hasDuration =
          line.durationSec !== undefined && line.durationSec !== null;
        if (hasReps === hasDuration) {
          throw new BadRequestException(
            `routines.${r}.exercises.${l}: set either reps or durationSec (exactly one)`,
          );
        }
      }),
    );

    const exerciseIds = [
      ...new Set(routines.flatMap((r) => r.exercises.map((l) => l.exerciseId))),
    ];
    const found = await this.prisma.exercise.count({
      where: { id: { in: exerciseIds } },
    });
    if (found !== exerciseIds.length) {
      throw new BadRequestException('Some exercises do not exist');
    }
  }

  /** Routine ids must be this program's; line ids must be their own routine's */
  private checkIdsBelongToProgram(
    current: { id: string; exercises: { id: string }[] }[],
    routines: RoutineDto[],
  ) {
    const linesByRoutine = new Map(
      current.map((r) => [r.id, new Set(r.exercises.map((l) => l.id))]),
    );
    for (const routine of routines) {
      const ownLines = routine.id ? linesByRoutine.get(routine.id) : new Set();
      const valid =
        ownLines !== undefined &&
        routine.exercises.every((line) => !line.id || ownLines.has(line.id));
      if (!valid) {
        throw new BadRequestException(
          'Some routines or exercise lines do not belong to this program',
        );
      }
    }
  }
}

function programData(dto: SaveProgramDto) {
  return {
    name: dto.name.trim(),
    profile: dto.profile,
    startDate: dto.startDate ? new Date(dto.startDate) : undefined,
  };
}

/** `order` comes from the position in the list (1, 2…) */
function routineData(routine: RoutineDto, index: number) {
  return {
    name: routine.name.trim(),
    order: index + 1,
    daysOfWeek: routine.daysOfWeek,
  };
}

/** Database fields of one exercise line. `order` comes from its position (1, 2, 3…). */
function lineData(line: RoutineExerciseDto, index: number) {
  return {
    exerciseId: line.exerciseId,
    order: index + 1,
    sets: line.sets,
    reps: line.reps ?? null,
    durationSec: line.durationSec ?? null,
    restSec: line.restSec,
    targetEffortPct: line.targetEffortPct ?? null,
    notes: line.notes?.trim() || null,
  };
}
