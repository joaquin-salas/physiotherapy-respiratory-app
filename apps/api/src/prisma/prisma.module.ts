import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// @Global: imported once in AppModule, then PrismaService is injectable everywhere
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
