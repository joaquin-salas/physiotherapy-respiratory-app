import { PartialType } from '@nestjs/mapped-types';
import { CreateExerciseDto } from './create-exercise.dto.js';

/** Body of PATCH /exercises/:id: same fields as create, but all optional. */
export class UpdateExerciseDto extends PartialType(CreateExerciseDto) {}
