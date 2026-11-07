import { IsIn, IsOptional } from 'class-validator';
import { ProgramProfile } from '../../generated/prisma/enums.js';

/** Query string of GET /routine-templates, e.g. ?profile=PREHAB */
export class ListRoutineTemplatesQueryDto {
  @IsOptional()
  @IsIn(Object.values(ProgramProfile))
  profile?: ProgramProfile;
}
