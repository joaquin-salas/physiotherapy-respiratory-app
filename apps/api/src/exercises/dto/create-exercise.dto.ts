import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { ExerciseGoal } from '../../generated/prisma/enums.js';

/** Body of POST /exercises. Invalid requests are rejected with 400 before reaching the service. */
export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @IsIn(Object.values(ExerciseGoal))
  goal: ExerciseGoal;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  level?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @IsOptional()
  @IsString()
  contraindications?: string;
}
