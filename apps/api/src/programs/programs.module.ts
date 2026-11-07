import { Module } from '@nestjs/common';
import { PatientsModule } from '../patients/patients.module.js';
import { PatientProgramsController } from './patient-programs.controller.js';
import { ProgramsController } from './programs.controller.js';
import { ProgramsService } from './programs.service.js';

@Module({
  imports: [PatientsModule], // access rules: a program is visible if its patient is
  controllers: [PatientProgramsController, ProgramsController],
  providers: [ProgramsService],
})
export class ProgramsModule {}
