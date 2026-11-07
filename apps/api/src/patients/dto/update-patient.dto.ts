import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { CreatePatientDto, PatientIdentityDto } from './create-patient.dto.js';

export class UpdatePatientIdentityDto extends PartialType(PatientIdentityDto) {}

/**
 * Body of PATCH /patients/:id: same fields as create, all optional
 * (identity fields too). Send `null` to clear an optional field.
 */
export class UpdatePatientDto extends PartialType(
  OmitType(CreatePatientDto, ['identity'] as const),
) {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePatientIdentityDto)
  identity?: UpdatePatientIdentityDto;
}
