import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { UserRole } from '../generated/prisma/client.js';
import { SaveProgramDto } from './dto/save-program.dto.js';
import { ProgramsService } from './programs.service.js';

// No DELETE: programs are part of the clinical record. They are ended instead.
@Roles(UserRole.PHYSIO, UserRole.ADMIN)
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get(':id') // GET /programs/:id
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.programsService.findOne(user, id);
  }

  @Put(':id') // PUT /programs/:id (the whole program)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveProgramDto,
  ) {
    return this.programsService.update(user, id, dto);
  }

  @Post(':id/end') // POST /programs/:id/end
  @HttpCode(200)
  end(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.programsService.end(user, id);
  }
}
