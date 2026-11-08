import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { generateToken, hashToken } from '../src/auth/session-token.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// All data here is fake and deleted after the tests

describe('Patient app: my program (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const userIds: string[] = [];
  const patientIds: string[] = [];
  let exerciseId: string;
  let physioToken: string;
  let physiotherapistId: string;

  const http = () => request(app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function sessionFor(userId: string, kind: 'WEB' | 'DEVICE') {
    const token = generateToken();
    await prisma.session.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        kind,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    return token;
  }

  /** A patient of the test physio, with a paired app (DEVICE session) */
  async function patientWithApp() {
    const patient = await prisma.patient.create({
      data: {
        diagnosis: 'Cáncer de pulmón',
        user: { create: { role: 'PATIENT' } },
        physiotherapist: { connect: { id: physiotherapistId } },
        identity: {
          create: {
            fullName: 'Paciente Ficticio',
            birthDate: new Date('1950-01-01'),
          },
        },
      },
    });
    patientIds.push(patient.id);
    userIds.push(patient.userId);
    return {
      id: patient.id,
      token: await sessionFor(patient.userId, 'DEVICE'),
    };
  }

  const assignProgram = (patientId: string, name: string) =>
    http()
      .post(`/api/patients/${patientId}/programs`)
      .set(as(physioToken))
      .send({
        name,
        routines: [
          {
            name: 'Rutina A',
            daysOfWeek: ['MONDAY', 'WEDNESDAY'],
            exercises: [
              {
                exerciseId,
                sets: 3,
                reps: 10,
                restSec: 60,
                targetEffortPct: 50,
              },
              { exerciseId, sets: 2, durationSec: 120, restSec: 30 },
            ],
          },
        ],
      })
      .expect(201)
      .then((res) => res.body as { id: string });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    const physio = await prisma.user.create({
      data: {
        role: 'PHYSIO',
        physiotherapist: { create: { fullName: 'Fisio' } },
      },
      include: { physiotherapist: true },
    });
    userIds.push(physio.id);
    physiotherapistId = physio.physiotherapist!.id;
    physioToken = await sessionFor(physio.id, 'WEB');

    const exercise = await prisma.exercise.create({
      data: {
        name: 'Sentarse y levantarse E2E',
        description: 'Prueba',
        goal: 'STRENGTH',
        equipment: ['silla'],
        contraindications: 'Solo para el fisio',
      },
    });
    exerciseId = exercise.id;
  });

  afterAll(async () => {
    await prisma.program.deleteMany({
      where: { patientId: { in: patientIds } },
    });
    await prisma.patient.deleteMany({ where: { id: { in: patientIds } } });
    await prisma.exercise.deleteMany({ where: { id: exerciseId } });
    await prisma.physiotherapist.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('returns null while the physio has not assigned a program', async () => {
    const patient = await patientWithApp();
    const res = await http()
      .get('/api/me/program')
      .set(as(patient.token))
      .expect(200);
    expect(res.body).toEqual({ program: null });
  });

  it("returns only the patient's own active program, with what the app needs", async () => {
    const patient = await patientWithApp();
    const other = await patientWithApp();
    await assignProgram(patient.id, 'Mío');
    await assignProgram(other.id, 'De otro');

    const res = await http()
      .get('/api/me/program')
      .set(as(patient.token))
      .expect(200);
    const program = res.body.program;
    expect(program.name).toBe('Mío');
    expect(program.routines[0]).toMatchObject({
      name: 'Rutina A',
      daysOfWeek: ['MONDAY', 'WEDNESDAY'],
    });
    expect(program.routines[0].exercises).toEqual([
      expect.objectContaining({
        order: 1,
        sets: 3,
        reps: 10,
        durationSec: null,
        restSec: 60,
      }),
      expect.objectContaining({
        order: 2,
        sets: 2,
        reps: null,
        durationSec: 120,
      }),
    ]);
    expect(program.routines[0].exercises[0].exercise).toEqual({
      id: exerciseId,
      name: 'Sentarse y levantarse E2E',
      description: 'Prueba',
      videoUrl: null,
      equipment: ['silla'],
    }); // no contraindications or other internal fields
  });

  it('stops returning a program once the physio ends it', async () => {
    const patient = await patientWithApp();
    const program = await assignProgram(patient.id, 'Terminado');
    await http()
      .post(`/api/programs/${program.id}/end`)
      .set(as(physioToken))
      .expect(200);

    const res = await http()
      .get('/api/me/program')
      .set(as(patient.token))
      .expect(200);
    expect(res.body).toEqual({ program: null });
  });

  it('keeps patient and physio routes apart', async () => {
    const patient = await patientWithApp();
    await http().get('/api/me/program').set(as(physioToken)).expect(403);
    await http()
      .get(`/api/patients/${patient.id}/programs`)
      .set(as(patient.token))
      .expect(403);
    await http().get('/api/me/program').expect(401);
  });
});
