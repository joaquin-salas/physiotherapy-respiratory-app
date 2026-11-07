import { Controller, Get } from '@nestjs/common';
import { Roles } from '../auth/auth.decorators.js';
import { UserRole } from '../generated/prisma/client.js';
import { PhysiotherapistsService } from './physiotherapists.service.js';

/** List of physios, so an admin can choose who a patient is assigned to */
@Roles(UserRole.ADMIN)
@Controller('physiotherapists')
export class PhysiotherapistsController {
  constructor(
    private readonly physiotherapistsService: PhysiotherapistsService,
  ) {}

  @Get() // GET /physiotherapists
  findAll() {
    return this.physiotherapistsService.findAll();
  }
}
