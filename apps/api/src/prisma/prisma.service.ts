import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * Database access for the whole API.
 * Inject it in any service: constructor(private readonly prisma: PrismaService) {}
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    super({ adapter });
  }

  // Runs when NestJS starts: fail fast if the database is unreachable
  async onModuleInit() {
    await this.$connect();
    await this.$queryRaw`SELECT 1`;
  }

  // Runs when NestJS shuts down: close the connections cleanly
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
