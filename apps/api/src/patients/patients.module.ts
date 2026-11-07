import { Module } from '@nestjs/common';
import { PatientsController } from './patients.controller.js';
import { PatientsService } from './patients.service.js';

@Module({
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService], // programs use it to check access to a patient
})
export class PatientsModule {}
