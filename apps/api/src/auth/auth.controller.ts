import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';
import { SESSION_COOKIE } from './auth.constants.js';
import { CurrentUser, Public } from './auth.decorators.js';
import type { AuthUser } from './auth.decorators.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { PairDeviceDto } from './dto/pair-device.dto.js';

const cookieOptions: CookieOptions = {
  httpOnly: true, // JavaScript in the page can't read it
  secure: true, // HTTPS only (browsers also accept it on http://localhost)
  sameSite: 'strict', // only sent on requests coming from our own site
  path: '/api', // only sent to the API, not with page/asset requests
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(ThrottlerGuard) // max 5 attempts per minute per IP
  @Post('login') // POST /auth/login
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, expiresAt, userId } = await this.authService.login(
      dto.email,
      dto.password,
    );
    res.cookie(SESSION_COOKIE, token, { ...cookieOptions, expires: expiresAt });
    return this.authService.getMe(userId);
  }

  /** Patient app: exchange the code from the connection sheet for a token (sent back as Bearer) */
  @Public()
  @UseGuards(ThrottlerGuard) // max 5 attempts per minute per IP
  @Post('pair') // POST /auth/pair
  @HttpCode(200)
  pair(@Body() dto: PairDeviceDto) {
    return this.authService.pair(dto.code, dto.deviceName);
  }

  @Post('logout') // POST /auth/logout
  @HttpCode(204)
  async logout(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.sessionId);
    res.clearCookie(SESSION_COOKIE, cookieOptions);
  }

  @Get('me') // GET /auth/me
  me(@CurrentUser() user: AuthUser) {
    return this.authService.getMe(user.userId);
  }
}
