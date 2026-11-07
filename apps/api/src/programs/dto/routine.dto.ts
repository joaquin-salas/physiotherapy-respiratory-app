import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Weekday } from '../../generated/prisma/enums.js';
import { RoutineExerciseDto } from './routine-exercise.dto.js';

/** A routine: the exercises the patient does, in order, on the chosen days */
export class RoutineDto {
  /** Only when editing: the existing routine to update. Routines without id are new. */
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsIn(Object.values(Weekday), { each: true })
  daysOfWeek: Weekday[];

  /** In session order: the first line is done first */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => RoutineExerciseDto)
  exercises: RoutineExerciseDto[];
}
