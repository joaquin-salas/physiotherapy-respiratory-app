import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';

@Module({
  // Rate limit used by ThrottlerGuard on the login route
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }])],
  controllers: [AuthController],
  providers: [
    AuthService,
    // Every route in the app requires a valid session unless marked @Public()
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
