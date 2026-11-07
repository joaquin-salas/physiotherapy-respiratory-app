import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Sex } from '../../generated/prisma/enums.js';
import { IsDateOnly } from '../../common/date-only.js';
import { IsNationalId, IsSpanishPhone } from '../patient-validation.js';

/** Identifying data (stored apart from clinical data, in PatientIdentity) */
export class PatientIdentityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName: string;

  @IsDateOnly({ notFuture: true }) // "YYYY-MM-DD"
  birthDate: string;

  @IsOptional()
  @IsSpanishPhone() // stored as 9 digits, e.g. "600123456"
  phone?: string | null;

  @IsOptional()
  @IsNationalId() // DNI/NIE with a valid control letter, stored uppercase
  nationalId?: string | null;
}

/** Body of POST /patients */
export class CreatePatientDto {
  /** Only admins set it (they choose the physio). For physios it's always themselves. */
  @IsOptional()
  @IsUUID()
  physiotherapistId?: string;

  @ValidateNested()
  @Type(() => PatientIdentityDto)
  identity: PatientIdentityDto;

  @IsOptional()
  @IsIn(Object.values(Sex))
  sex?: Sex | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(20)
  @Max(300)
  weightKg?: number | null;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(250)
  heightCm?: number | null;

  @IsString()
  @IsNotEmpty()
  diagnosis: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  stage?: string | null;

  @IsOptional()
  @IsString()
  currentTreatment?: string | null;

  @IsOptional()
  @IsDateOnly() // may be in the future (prehabilitation before surgery)
  surgeryDate?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  comorbidities?: string[];

  @IsOptional()
  @IsString()
  initialAssessment?: string | null;
}
