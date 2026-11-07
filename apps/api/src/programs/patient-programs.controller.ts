import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { UserRole } from '../generated/prisma/client.js';
import { SaveProgramDto } from './dto/save-program.dto.js';
import { ProgramsService } from './programs.service.js';

/** Programs seen from a patient: list them and assign a new one */
@Roles(UserRole.PHYSIO, UserRole.ADMIN)
@Controller('patients/:patientId/programs')
export class PatientProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get() // GET /patients/:patientId/programs
  findAll(
    @CurrentUser() user: AuthUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    return this.programsService.findForPatient(user, patientId);
  }

  @Post() // POST /patients/:patientId/programs
  create(
    @CurrentUser() user: AuthUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: SaveProgramDto,
  ) {
    return this.programsService.create(user, patientId, dto);
  }
}
