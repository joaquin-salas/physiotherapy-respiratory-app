import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { UserRole } from '../generated/prisma/client.js';
import { DevicesService } from './devices.service.js';

/** The patient app's connection, managed from the patient record in the panel */
@Roles(UserRole.PHYSIO, UserRole.ADMIN)
@Controller('patients/:patientId')
export class PatientDeviceController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get('device') // GET /patients/:patientId/device
  getStatus(
    @CurrentUser() user: AuthUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    return this.devicesService.getStatus(user, patientId);
  }

  @Delete('device') // DELETE /patients/:patientId/device
  @HttpCode(204)
  disconnect(
    @CurrentUser() user: AuthUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    return this.devicesService.disconnect(user, patientId);
  }

  @Post('pairing-code') // POST /patients/:patientId/pairing-code
  createPairingCode(
    @CurrentUser() user: AuthUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    return this.devicesService.createPairingCode(user, patientId);
  }
}
