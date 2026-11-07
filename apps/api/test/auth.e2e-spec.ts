import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { hashPassword } from '../src/auth/password.js';
import { generateToken, hashToken } from '../src/auth/session-token.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Fake test account (never real data), deleted after the tests
const email = `e2e-${randomUUID()}@example.com`;
const password = 'test-password-123';

/** Extracts "session=<token>" from the login response's Set-Cookie header */
function sessionCookie(res: request.Response): string {
  const header = res.headers['set-cookie'] as unknown as string[];
  const cookie = header.find((c) => c.startsWith('session='));
  if (!cookie) throw new Error('no session cookie');
  return cookie;
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let userId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    const user = await prisma.user.create({
      data: {
        role: 'PHYSIO',
        email,
        passwordHash: await hashPassword(password),
        physiotherapist: { create: { fullName: 'Fisio E2E' } },
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.physiotherapist.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } }); // sessions cascade
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('rejects protected routes without a session', async () => {
    await http().get('/api/exercises').expect(401);
    await http().get('/api/auth/me').expect(401);
  });

  it('rejects a wrong password and an unknown email the same way', async () => {
    const wrong = await http()
      .post('/api/auth/login')
      .send({ email, password: 'nope' })
      .expect(401);
    const unknown = await http()
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password })
      .expect(401);
    expect(wrong.body).toEqual(unknown.body);
  });

  it('logs in, uses the session, and logs out', async () => {
    const login = await http()
      .post('/api/auth/login')
      .send({ email: email.toUpperCase(), password }) // email is case-insensitive
      .expect(200);

    const cookie = sessionCookie(login);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Path=\/api/);
    expect(login.body).toMatchObject({
      email,
      role: 'PHYSIO',
      physiotherapist: { fullName: 'Fisio E2E' },
    });

    const token = cookie.split(';')[0].replace('session=', '');

    // Cookie (web panel) and Bearer header (mobile app) both work
    await http().get('/api/exercises').set('Cookie', cookie).expect(200);
    await http()
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Only the hash is stored, never the token
    const stored = await prisma.session.findFirstOrThrow({ where: { userId } });
    expect(stored.tokenHash).not.toBe(token);

    await http().post('/api/auth/logout').set('Cookie', cookie).expect(204);
    await http().get('/api/auth/me').set('Cookie', cookie).expect(401);
  });

  it('forbids roles that are not allowed on a route', async () => {
    const patientUser = await prisma.user.create({ data: { role: 'PATIENT' } });
    const token = generateToken();
    await prisma.session.create({
      data: {
        userId: patientUser.id,
        tokenHash: hashToken(token),
        kind: 'DEVICE',
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    await http()
      .get('/api/exercises')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    await prisma.user.delete({ where: { id: patientUser.id } });
  });
});
