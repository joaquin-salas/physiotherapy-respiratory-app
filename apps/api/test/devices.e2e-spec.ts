import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { generateToken, hashToken } from '../src/auth/session-token.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// All data here is fake and deleted after the tests

describe('Patient app pairing (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const userIds: string[] = [];

  const http = () => request(app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  /** A physio with a valid panel session */
  async function physioWithToken(fullName: string) {
    const user = await prisma.user.create({
      data: { role: 'PHYSIO', physiotherapist: { create: { fullName } } },
    });
    userIds.push(user.id);
    const token = generateToken();
    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        kind: 'WEB',
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    return token;
  }

  let physioA: string;
  let physioB: string;

  async function createPatient() {
    const { body } = await http()
      .post('/api/patients')
      .set(as(physioA))
      .send({
        identity: { fullName: 'Paciente Ficticio', birthDate: '1950-03-15' },
        diagnosis: 'Cáncer de pulmón no microcítico',
      })
      .expect(201);
    return body as { id: string; userId: string };
  }

  async function newCode(patientId: string) {
    const { body } = await http()
      .post(`/api/patients/${patientId}/pairing-code`)
      .set(as(physioA))
      .expect(201);
    return body as { code: string; expiresAt: string };
  }

  const pair = (code: string) =>
    http().post('/api/auth/pair').send({ code, deviceName: 'Android' });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      // These tests pair more than 5 times a minute, the rate limit of POST /auth/pair
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    physioA = await physioWithToken('Fisio A');
    physioB = await physioWithToken('Fisio B');
  });

  afterAll(async () => {
    const patients = await prisma.patient.findMany({
      where: { physiotherapist: { userId: { in: userIds } } },
    });
    await prisma.patient.deleteMany({
      where: { id: { in: patients.map((p) => p.id) } },
    });
    await prisma.physiotherapist.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [...userIds, ...patients.map((p) => p.userId)] } },
    });
    await app.close();
  });

  it('pairs the app with the code from the sheet, once', async () => {
    const patient = await createPatient();

    const before = await http()
      .get(`/api/patients/${patient.id}/device`)
      .set(as(physioA))
      .expect(200);
    expect(before.body).toEqual({ device: null, pendingCodeExpiresAt: null });

    const { code, expiresAt } = await newCode(patient.id);
    expect(code).toMatch(/^[A-Z2-9]{10}$/);
    const days = (new Date(expiresAt).getTime() - Date.now()) / 86_400_000;
    expect(Math.round(days)).toBe(30);

    // Only the hash is stored
    const account = await prisma.user.findUniqueOrThrow({
      where: { id: patient.userId },
    });
    expect(account.pairingCodeHash).toBe(hashToken(code));

    const pending = await http()
      .get(`/api/patients/${patient.id}/device`)
      .set(as(physioA));
    expect(pending.body.pendingCodeExpiresAt).not.toBeNull();

    // Typed as printed: lowercase, with the dash
    const typed = `${code.slice(0, 5)}-${code.slice(5)}`.toLowerCase();
    const paired = await pair(typed).expect(200);
    const token = paired.body.token as string;

    // The app is now logged in as the patient...
    const me = await http().get('/api/auth/me').set(as(token)).expect(200);
    expect(me.body).toMatchObject({ id: patient.userId, role: 'PATIENT' });
    // ...but can't use the panel's routes
    await http().get('/api/patients').set(as(token)).expect(403);

    const status = await http()
      .get(`/api/patients/${patient.id}/device`)
      .set(as(physioA));
    expect(status.body.device).toMatchObject({ name: 'Android' });
    expect(status.body.pendingCodeExpiresAt).toBeNull();

    // The sheet is now useless
    await pair(code).expect(400);
  });

  it('gives the same error for every bad code', async () => {
    const unknown = await pair('AAAAA-AAAAA').expect(400);
    const garbage = await pair('not a code').expect(400);
    expect(unknown.body.message).toBe(garbage.body.message);
  });

  it('rejects an expired code', async () => {
    const patient = await createPatient();
    const { code } = await newCode(patient.id);
    await prisma.user.update({
      where: { id: patient.userId },
      data: { pairingCodeExpiresAt: new Date(Date.now() - 1000) },
    });
    await pair(code).expect(400);
  });

  it('a new sheet replaces the previous one', async () => {
    const patient = await createPatient();
    const first = await newCode(patient.id);
    const second = await newCode(patient.id);
    await pair(first.code).expect(400);
    await pair(second.code).expect(200);
  });

  it('keeps one device at a time and lets the physio disconnect it', async () => {
    const patient = await createPatient();
    const oldPhone = (await pair((await newCode(patient.id)).code)).body.token;
    const newPhone = (await pair((await newCode(patient.id)).code)).body.token;

    await http().get('/api/auth/me').set(as(oldPhone)).expect(401);
    await http().get('/api/auth/me').set(as(newPhone)).expect(200);

    await http()
      .delete(`/api/patients/${patient.id}/device`)
      .set(as(physioA))
      .expect(204);
    await http().get('/api/auth/me').set(as(newPhone)).expect(401);
  });

  it("hides another physio's patient (404)", async () => {
    const patient = await createPatient();
    await http()
      .post(`/api/patients/${patient.id}/pairing-code`)
      .set(as(physioB))
      .expect(404);
    await http()
      .get(`/api/patients/${patient.id}/device`)
      .set(as(physioB))
      .expect(404);
  });

  it('ending the follow-up cancels the sheet and blocks new ones', async () => {
    const patient = await createPatient();
    const { code } = await newCode(patient.id);
    await http()
      .post(`/api/patients/${patient.id}/discharge`)
      .set(as(physioA))
      .expect(200);

    await pair(code).expect(400);
    await http()
      .post(`/api/patients/${patient.id}/pairing-code`)
      .set(as(physioA))
      .expect(409);
  });
});
