import { IsIn, IsOptional } from 'class-validator';

/** Query string of GET /patients, e.g. ?status=discharged */
export class ListPatientsQueryDto {
  @IsOptional()
  @IsIn(['active', 'discharged'])
  status?: 'active' | 'discharged';
}
