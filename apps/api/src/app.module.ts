import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { ExercisesModule } from './exercises/exercises.module.js';
import { PatientsModule } from './patients/patients.module.js';
import { PhysiotherapistsModule } from './physiotherapists/physiotherapists.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProgramsModule } from './programs/programs.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ExercisesModule,
    PatientsModule,
    PhysiotherapistsModule,
    ProgramsModule,
  ],
})
export class AppModule {}
