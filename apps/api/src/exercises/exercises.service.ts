import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateExerciseDto } from './dto/create-exercise.dto.js';
import { UpdateExerciseDto } from './dto/update-exercise.dto.js';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateExerciseDto) {
    return this.prisma.exercise.create({ data: dto });
  }

  findAll() {
    return this.prisma.exercise.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException(`Exercise ${id} not found`);
    return exercise;
  }

  async update(id: string, dto: UpdateExerciseDto) {
    try {
      return await this.prisma.exercise.update({ where: { id }, data: dto });
    } catch (error) {
      throw this.notFoundOr(error, id);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.exercise.delete({ where: { id } });
    } catch (error) {
      // P2003 = foreign key violation: the exercise is used in a program
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'This exercise is used in a program and cannot be deleted',
        );
      }
      throw this.notFoundOr(error, id);
    }
  }

  // Prisma throws error P2025 when the record to update/delete doesn't exist → turn it into a 404
  private notFoundOr(error: unknown, id: string) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return new NotFoundException(`Exercise ${id} not found`);
    }
    return error;
  }
}
