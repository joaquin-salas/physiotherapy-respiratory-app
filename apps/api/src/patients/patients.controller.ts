import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { UserRole } from '../generated/prisma/client.js';
import { CreatePatientDto } from './dto/create-patient.dto.js';
import { ListPatientsQueryDto } from './dto/list-patients-query.dto.js';
import { UpdatePatientDto } from './dto/update-patient.dto.js';
import { PatientsService } from './patients.service.js';

// No DELETE: clinical records must be kept, so patients are discharged instead
@Roles(UserRole.PHYSIO, UserRole.ADMIN)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get() // GET /patients?status=active|discharged
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListPatientsQueryDto) {
    return this.patientsService.findAll(user, query.status);
  }

  @Post() // POST /patients
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePatientDto) {
    return this.patientsService.create(user, dto);
  }

  @Get(':id') // GET /patients/:id
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.patientsService.findOne(user, id);
  }

  @Patch(':id') // PATCH /patients/:id
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientsService.update(user, id, dto);
  }

  @Post(':id/discharge') // POST /patients/:id/discharge
  @HttpCode(200)
  discharge(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.patientsService.discharge(user, id);
  }

  @Post(':id/reactivate') // POST /patients/:id/reactivate
  @HttpCode(200)
  reactivate(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.patientsService.reactivate(user, id);
  }
}
