import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type ProgramProfile } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  exerciseLineData,
  validateExerciseLines,
} from '../programs/routine-exercises.js';
import { SaveRoutineTemplateDto } from './dto/save-routine-template.dto.js';

/** What every template response includes: its exercises in order, with names */
const templateInclude = {
  exercises: {
    orderBy: { order: 'asc' },
    include: {
      exercise: { select: { id: true, name: true, goal: true, level: true } },
    },
  },
} satisfies Prisma.RoutineTemplateInclude;

/**
 * The shared library of routine templates. Any physio can create, edit or delete them:
 * they aren't clinical records, and programs keep their own copy of the exercises.
 */
@Injectable()
export class RoutineTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(profile?: ProgramProfile) {
    return this.prisma.routineTemplate.findMany({
      where: { profile },
      include: templateInclude,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.routineTemplate.findUnique({
      where: { id },
      include: templateInclude,
    });
    if (!template) throw new NotFoundException(`Template ${id} not found`);
    return template;
  }

  async create(dto: SaveRoutineTemplateDto) {
    await this.validate(dto);
    return this.prisma.routineTemplate.create({
      data: {
        ...templateData(dto),
        exercises: { create: dto.exercises.map(exerciseLineData) },
      },
      include: templateInclude,
    });
  }

  /** Replaces the whole template. Its lines can be recreated: nothing points to them. */
  async update(id: string, dto: SaveRoutineTemplateDto) {
    await this.findOne(id); // 404 if it doesn't exist
    await this.validate(dto);

    await this.prisma.$transaction([
      this.prisma.routineTemplateExercise.deleteMany({
        where: { templateId: id },
      }),
      this.prisma.routineTemplate.update({
        where: { id },
        data: {
          ...templateData(dto),
          exercises: { create: dto.exercises.map(exerciseLineData) },
        },
      }),
    ]);
    return this.findOne(id);
  }

  /** Routines loaded from it keep their exercises; only their templateId becomes null */
  async remove(id: string) {
    try {
      await this.prisma.routineTemplate.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Template ${id} not found`);
      }
      throw error;
    }
  }

  private validate(dto: SaveRoutineTemplateDto) {
    return validateExerciseLines(this.prisma, [
      { label: 'exercises', lines: dto.exercises },
    ]);
  }
}

function templateData(dto: SaveRoutineTemplateDto) {
  return {
    name: dto.name.trim(),
    profile: dto.profile ?? null,
    description: dto.description?.trim() || null,
  };
}
