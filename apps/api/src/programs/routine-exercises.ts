import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RoutineExerciseDto } from './dto/routine-exercise.dto.js';

// Shared by patient routines (programs) and routine templates: same exercise-line rules.

/**
 * Checks what class-validator can't: reps XOR duration on every line, and that every
 * exercise exists. `lists` are the exercise lists to check, labelled for error messages
 * (e.g. "routines.0.exercises").
 */
export async function validateExerciseLines(
  prisma: PrismaService,
  lists: { label: string; lines: RoutineExerciseDto[] }[],
) {
  for (const { label, lines } of lists) {
    lines.forEach((line, index) => {
      const hasReps = line.reps !== undefined && line.reps !== null;
      const hasDuration =
        line.durationSec !== undefined && line.durationSec !== null;
      if (hasReps === hasDuration) {
        throw new BadRequestException(
          `${label}.${index}: set either reps or durationSec (exactly one)`,
        );
      }
    });
  }

  const exerciseIds = [
    ...new Set(lists.flatMap((list) => list.lines.map((l) => l.exerciseId))),
  ];
  const found = await prisma.exercise.count({
    where: { id: { in: exerciseIds } },
  });
  if (found !== exerciseIds.length) {
    throw new BadRequestException('Some exercises do not exist');
  }
}

/** Database fields of one exercise line. `order` comes from its position (1, 2, 3…). */
export function exerciseLineData(line: RoutineExerciseDto, index: number) {
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
