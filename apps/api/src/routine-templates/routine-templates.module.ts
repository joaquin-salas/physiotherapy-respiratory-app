import { Module } from '@nestjs/common';
import { RoutineTemplatesController } from './routine-templates.controller.js';
import { RoutineTemplatesService } from './routine-templates.service.js';

@Module({
  controllers: [RoutineTemplatesController],
  providers: [RoutineTemplatesService],
})
export class RoutineTemplatesModule {}
