import { Module } from '@nestjs/common';
import { PhysiotherapistsController } from './physiotherapists.controller.js';
import { PhysiotherapistsService } from './physiotherapists.service.js';

@Module({
  controllers: [PhysiotherapistsController],
  providers: [PhysiotherapistsService],
})
export class PhysiotherapistsModule {}
