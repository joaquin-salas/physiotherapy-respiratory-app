import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { IsDateOnly } from '../../common/date-only.js';
import { ProgramProfile } from '../../generated/prisma/enums.js';
import { RoutineDto } from './routine.dto.js';

/** Physios said a patient has at most two routines (usually very similar) */
export const MAX_ROUTINES = 2;

/**
 * Body of POST /patients/:patientId/programs and PUT /programs/:id.
 * Always the whole program. On PUT, routines and their exercises with `id` are updated,
 * those without are added, and missing ones are removed.
 */
export class SaveProgramDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsIn(Object.values(ProgramProfile))
  profile?: ProgramProfile | null;

  /** Defaults to today */
  @IsOptional()
  @IsDateOnly()
  startDate?: string;

  /** A day may appear in only one routine (checked in the service) */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_ROUTINES)
  @ValidateNested({ each: true })
  @Type(() => RoutineDto)
  routines: RoutineDto[];
}
