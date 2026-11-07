import 'dotenv/config'; // loads .env into process.env (must be the first import)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  app.enableShutdownHooks(); // lets PrismaService close DB connections on Ctrl+C
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
