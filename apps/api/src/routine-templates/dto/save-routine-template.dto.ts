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
import { ProgramProfile } from '../../generated/prisma/enums.js';
import { RoutineExerciseDto } from '../../programs/dto/routine-exercise.dto.js';

/**
 * Body of POST /routine-templates and PUT /routine-templates/:id (always the whole template).
 * Exercise lines follow the same rules as in a patient's routine; `id` on lines is ignored.
 */
export class SaveRoutineTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsIn(Object.values(ProgramProfile))
  profile?: ProgramProfile | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  /** In session order */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => RoutineExerciseDto)
  exercises: RoutineExerciseDto[];
}
