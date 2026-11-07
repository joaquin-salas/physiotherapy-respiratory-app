import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { ExercisesModule } from './exercises/exercises.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, AuthModule, ExercisesModule],
})
export class AppModule {}
