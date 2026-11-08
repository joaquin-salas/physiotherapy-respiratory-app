import { Controller, Get } from '@nestjs/common';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { UserRole } from '../generated/prisma/client.js';
import { ProgramsService } from './programs.service.js';

/**
 * Patient app routes. The patient comes from the session token, never from the URL,
 * so a patient can only ever get their own data.
 */
@Roles(UserRole.PATIENT)
@Controller('me')
export class MyProgramController {
  constructor(private readonly programsService: ProgramsService) {}

  /** The active program, or `{ program: null }` if the physio hasn't assigned one yet */
  @Get('program') // GET /me/program
  async findMine(@CurrentUser() user: AuthUser) {
    return { program: await this.programsService.findActiveForPatient(user) };
  }
}
