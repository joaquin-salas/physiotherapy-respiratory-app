import {
  IsDivisibleBy,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * One exercise of a routine: which exercise and how to do it.
 * Each line needs either `reps` or `durationSec` (exactly one): checked in the service.
 */
export class RoutineExerciseDto {
  /** Only when editing: the existing line to update. Lines without id are new. */
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID()
  exerciseId: string;

  @IsInt()
  @Min(1)
  @Max(20)
  sets: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  reps?: number | null;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(7200) // 2 hours
  durationSec?: number | null;

  @IsInt()
  @Min(0)
  @Max(600)
  restSec: number;

  /** Target perceived effort ("fatiga percibida"), 0–100 in steps of 10 */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @IsDivisibleBy(10)
  targetEffortPct?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
