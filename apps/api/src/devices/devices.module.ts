import { Module } from '@nestjs/common';
import { PatientsModule } from '../patients/patients.module.js';
import { DevicesService } from './devices.service.js';
import { PatientDeviceController } from './patient-device.controller.js';

@Module({
  imports: [PatientsModule], // access rules: same patients the physio can see
  controllers: [PatientDeviceController],
  providers: [DevicesService],
})
export class DevicesModule {}
