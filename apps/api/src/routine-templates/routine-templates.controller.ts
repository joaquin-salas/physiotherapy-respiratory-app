import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/auth.decorators.js';
import { UserRole } from '../generated/prisma/client.js';
import { ListRoutineTemplatesQueryDto } from './dto/list-routine-templates-query.dto.js';
import { SaveRoutineTemplateDto } from './dto/save-routine-template.dto.js';
import { RoutineTemplatesService } from './routine-templates.service.js';

/** Shared library: every physio (and admin) can read and change every template */
@Roles(UserRole.PHYSIO, UserRole.ADMIN)
@Controller('routine-templates')
export class RoutineTemplatesController {
  constructor(private readonly templatesService: RoutineTemplatesService) {}

  @Get() // GET /routine-templates?profile=PREHAB
  findAll(@Query() query: ListRoutineTemplatesQueryDto) {
    return this.templatesService.findAll(query.profile);
  }

  @Post() // POST /routine-templates
  create(@Body() dto: SaveRoutineTemplateDto) {
    return this.templatesService.create(dto);
  }

  @Get(':id') // GET /routine-templates/:id
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.findOne(id);
  }

  @Put(':id') // PUT /routine-templates/:id (the whole template)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveRoutineTemplateDto,
  ) {
    return this.templatesService.update(id, dto);
  }

  @Delete(':id') // DELETE /routine-templates/:id
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.remove(id);
  }
}
