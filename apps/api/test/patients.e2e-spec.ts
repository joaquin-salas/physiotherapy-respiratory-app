import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { generateToken, hashToken } from '../src/auth/session-token.js';
import { UserRole } from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// All data here is fake and deleted after the tests

/** A made-up DNI with a valid control letter, different on every run */
function fakeDni(): string {
  const digits = `99${String(Date.now()).slice(-6)}`;
  return digits + 'TRWAGMYFPDXBNJZSQVHLCKE'[Number(digits) % 23];
}

describe('Patients (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const userIds: string[] = [];

  /** Creates a user with a valid session and returns its Bearer token */
  async function userWithToken(role: UserRole, physioName?: string) {
    const user = await prisma.user.create({
      data: {
        role,
        physiotherapist: physioName
          ? { create: { fullName: physioName } }
          : undefined,
      },
      include: { physiotherapist: true },
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
    return { token, physiotherapistId: user.physiotherapist?.id };
  }

  let physioA: { token: string; physiotherapistId?: string };
  let physioB: { token: string; physiotherapistId?: string };
  let admin: { token: string };

  const http = () => request(app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  const newPatient = {
    identity: {
      fullName: 'Paciente Ficticio',
      birthDate: '1950-03-15',
      nationalId: fakeDni(),
    },
    sex: 'FEMALE',
    weightKg: 64.5,
    heightCm: 160,
    diagnosis: 'Cáncer de pulmón no microcítico',
    stage: 'IIIA',
    surgeryDate: '2026-09-01',
    comorbidities: ['EPOC', 'Hipertensión'],
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    physioA = await userWithToken('PHYSIO', 'Fisio A');
    physioB = await userWithToken('PHYSIO', 'Fisio B');
    admin = await userWithToken('ADMIN');
  });

  afterAll(async () => {
    // Patients (and their users) created through the API belong to physios A and B
    const patients = await prisma.patient.findMany({
      where: {
        physiotherapist: { userId: { in: userIds } },
      },
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

  it('lets a physio create, list, view and edit their own patient', async () => {
    const created = await http()
      .post('/api/patients')
      .set(as(physioA.token))
      .send(newPatient)
      .expect(201);

    expect(created.body).toMatchObject({
      diagnosis: newPatient.diagnosis,
      weightKg: 64.5,
      identity: { fullName: 'Paciente Ficticio' },
      physiotherapist: { id: physioA.physiotherapistId },
    });
    const id = created.body.id as string;

    const list = await http()
      .get('/api/patients')
      .set(as(physioA.token))
      .expect(200);
    expect(list.body.map((p: { id: string }) => p.id)).toContain(id);

    const updated = await http()
      .patch(`/api/patients/${id}`)
      .set(as(physioA.token))
      .send({ stage: null, identity: { phone: '600000000' } })
      .expect(200);
    expect(updated.body.stage).toBeNull();
    expect(updated.body.identity.phone).toBe('600000000');
    expect(updated.body.identity.fullName).toBe('Paciente Ficticio');
  });

  it("hides another physio's patients (404, not 403)", async () => {
    const { body } = await http()
      .post('/api/patients')
      .set(as(physioA.token))
      .send({
        ...newPatient,
        identity: { ...newPatient.identity, nationalId: undefined },
      })
      .expect(201);

    await http()
      .get(`/api/patients/${body.id}`)
      .set(as(physioB.token))
      .expect(404);
    await http()
      .patch(`/api/patients/${body.id}`)
      .set(as(physioB.token))
      .send({ stage: 'IV' })
      .expect(404);

    const listB = await http().get('/api/patients').set(as(physioB.token));
    expect(listB.body.map((p: { id: string }) => p.id)).not.toContain(body.id);
  });

  it('stops a physio from assigning a patient to someone else', async () => {
    await http()
      .post('/api/patients')
      .set(as(physioA.token))
      .send({ ...newPatient, physiotherapistId: physioB.physiotherapistId })
      .expect(403);
  });

  it('lets an admin see every patient and choose the physio', async () => {
    await http()
      .post('/api/patients')
      .set(as(admin.token))
      .send({
        ...newPatient,
        identity: { ...newPatient.identity, nationalId: undefined },
      })
      .expect(400); // admin must say which physio

    const { body } = await http()
      .post('/api/patients')
      .set(as(admin.token))
      .send({
        ...newPatient,
        identity: { ...newPatient.identity, nationalId: undefined },
        physiotherapistId: physioB.physiotherapistId,
      })
      .expect(201);
    expect(body.physiotherapist.id).toBe(physioB.physiotherapistId);

    await http()
      .get(`/api/patients/${body.id}`)
      .set(as(admin.token))
      .expect(200);

    const physios = await http()
      .get('/api/physiotherapists')
      .set(as(admin.token))
      .expect(200);
    expect(physios.body.length).toBeGreaterThanOrEqual(2);
    await http()
      .get('/api/physiotherapists')
      .set(as(physioA.token))
      .expect(403);
  });

  it('rejects a duplicate national ID and invalid data', async () => {
    await http()
      .post('/api/patients')
      .set(as(physioA.token))
      .send(newPatient) // same nationalId as the first test
      .expect(409);

    await http()
      .post('/api/patients')
      .set(as(physioA.token))
      .send({
        ...newPatient,
        diagnosis: '',
        identity: { fullName: 'X', birthDate: 'ayer' },
      })
      .expect(400);
  });

  it('rejects malformed phone, DNI and dates, and stores them normalized', async () => {
    const withIdentity = (identity: object) => ({
      ...newPatient,
      identity: {
        fullName: 'Paciente Ficticio',
        birthDate: '1950-03-15',
        ...identity,
      },
    });
    const post = (body: object) =>
      http().post('/api/patients').set(as(physioA.token)).send(body);

    await post(withIdentity({ phone: '12345' })).expect(400);
    await post(withIdentity({ nationalId: '12345678A' })).expect(400); // wrong letter
    await post(withIdentity({ birthDate: '19500-03-15' })).expect(400);
    await post(withIdentity({ birthDate: '2999-01-01' })).expect(400); // future
    await post({ ...withIdentity({}), surgeryDate: '2026-02-30' }).expect(400);

    const { body } = await post(
      withIdentity({ phone: '+34 600 12 34 56', nationalId: ' x1234567-l ' }),
    ).expect(201);
    expect(body.identity.phone).toBe('600123456');
    expect(body.identity.nationalId).toBe('X1234567L');
  });

  it('discharges and reactivates a patient', async () => {
    const { body } = await http()
      .post('/api/patients')
      .set(as(physioA.token))
      .send({
        ...newPatient,
        identity: { ...newPatient.identity, nationalId: undefined },
      })
      .expect(201);

    const discharged = await http()
      .post(`/api/patients/${body.id}/discharge`)
      .set(as(physioA.token))
      .expect(200);
    expect(discharged.body.dischargedAt).not.toBeNull();

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: body.userId },
    });
    expect(user.isActive).toBe(false); // the patient app stops working

    const active = await http().get('/api/patients').set(as(physioA.token));
    expect(active.body.map((p: { id: string }) => p.id)).not.toContain(body.id);
    const old = await http()
      .get('/api/patients?status=discharged')
      .set(as(physioA.token));
    expect(old.body.map((p: { id: string }) => p.id)).toContain(body.id);

    const reactivated = await http()
      .post(`/api/patients/${body.id}/reactivate`)
      .set(as(physioA.token))
      .expect(200);
    expect(reactivated.body.dischargedAt).toBeNull();
  });
});
