import 'dotenv/config'; // loads .env into process.env (must be the first import)
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validates every request body against its DTO (class-validator decorators)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties that aren't in the DTO
      forbidNonWhitelisted: true, // ...and reject the request if there are any
    }),
  );

  app.enableShutdownHooks(); // lets PrismaService close DB connections on Ctrl+C
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
