import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateExerciseDto } from './dto/create-exercise.dto.js';
import { UpdateExerciseDto } from './dto/update-exercise.dto.js';
import { ExercisesService } from './exercises.service.js';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Post() // POST /exercises
  create(@Body() dto: CreateExerciseDto) {
    return this.exercisesService.create(dto);
  }

  @Get() // GET /exercises
  findAll() {
    return this.exercisesService.findAll();
  }

  @Get(':id') // GET /exercises/:id
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.exercisesService.findOne(id);
  }

  @Patch(':id') // PATCH /exercises/:id
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExerciseDto,
  ) {
    return this.exercisesService.update(id, dto);
  }

  @Delete(':id') // DELETE /exercises/:id
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.exercisesService.remove(id);
  }
}
