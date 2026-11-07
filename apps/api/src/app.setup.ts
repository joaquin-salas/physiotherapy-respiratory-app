import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

/** App-wide settings. Shared by main.ts and the e2e tests so both behave the same. */
export function configureApp(app: INestApplication) {
  // All routes start with /api (e.g. /api/exercises), so the web panel's proxy can forward them
  app.setGlobalPrefix('api');

  // Fills request.cookies, where AuthGuard reads the session token
  app.use(cookieParser());

  // Validates every request body against its DTO (class-validator decorators)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties that aren't in the DTO
      forbidNonWhitelisted: true, // ...and reject the request if there are any
    }),
  );
}
