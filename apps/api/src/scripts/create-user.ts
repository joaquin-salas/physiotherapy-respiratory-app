/**
 * Creates a physio or admin account from the command line.
 * There is no public sign-up: accounts are created by someone trusted.
 *
 * Usage (from the repo root):
 *   pnpm --filter api user:create --role PHYSIO --email ana@example.com --name "Ana Pérez"
 *   pnpm --filter api user:create --role ADMIN --email admin@example.com
 *
 * A random password is generated and printed once.
 */
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from '../auth/password.js';
import { PrismaClient, UserRole } from '../generated/prisma/client.js';

const { values } = parseArgs({
  options: {
    role: { type: 'string' },
    email: { type: 'string' },
    name: { type: 'string' },
    license: { type: 'string' },
  },
});

function fail(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

const role = values.role?.toUpperCase();
if (role !== UserRole.PHYSIO && role !== UserRole.ADMIN) {
  fail('--role must be PHYSIO or ADMIN');
}

const email = values.email?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  fail('--email must be a valid email address');
}

const fullName = values.name?.trim();
if (role === UserRole.PHYSIO && !fullName) {
  fail('--name is required for PHYSIO accounts');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

try {
  if (await prisma.user.findUnique({ where: { email } })) {
    fail(`a user with email ${email} already exists`);
  }

  const password = randomBytes(12).toString('base64url'); // 16 characters
  const user = await prisma.user.create({
    data: {
      role,
      email,
      passwordHash: await hashPassword(password),
      physiotherapist:
        role === UserRole.PHYSIO
          ? { create: { fullName: fullName!, licenseNumber: values.license } }
          : undefined,
    },
  });

  console.log(`Created ${role} account ${user.email}`);
  console.log(`Password: ${password}`);
  console.log('Save it now: it will not be shown again.');
} finally {
  await prisma.$disconnect();
}
