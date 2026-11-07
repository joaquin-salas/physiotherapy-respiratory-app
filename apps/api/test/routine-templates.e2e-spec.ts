import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { generateToken, hashToken } from '../src/auth/session-token.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// All data here is fake and deleted after the tests

interface TemplateBody {
  id: string;
  name: string;
  profile: string | null;
  exercises: { order: number; targetEffortPct: number | null }[];
}

describe('Routine templates (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const userIds: string[] = [];
  const templateIds: string[] = [];
  let exerciseId: string;
  let patientId: string;
  let tokenA: string;
  let tokenB: string;

  const http = () => request(app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function physioWithToken(fullName: string) {
    const user = await prisma.user.create({
      data: { role: 'PHYSIO', physiotherapist: { create: { fullName } } },
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
    return { token, physiotherapistId: user.physiotherapist!.id };
  }

  const line = (extra: object = {}) => ({
    exerciseId,
    sets: 2,
    reps: 8,
    restSec: 45,
    targetEffortPct: 40,
    ...extra,
  });

  const template = (extra: object = {}) => ({
    name: 'Prehabilitación básica E2E',
    profile: 'PREHAB',
    description: 'Respiración y movilidad',
    exercises: [line(), line({ reps: null, durationSec: 300 })],
    ...extra,
  });

  const createTemplate = async (body: object, token = tokenA) => {
    const res = await http()
      .post('/api/routine-templates')
      .set(as(token))
      .send(body);
    if (res.status === 201) templateIds.push((res.body as TemplateBody).id);
    return res;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    const physioA = await physioWithToken('Fisio A');
    tokenA = physioA.token;
    tokenB = (await physioWithToken('Fisio B')).token;

    exerciseId = (
      await prisma.exercise.create({
        data: {
          name: 'Soplar pajita E2E',
          description: 'Prueba',
          goal: 'RESPIRATORY',
        },
      })
    ).id;

    const patient = await prisma.patient.create({
      data: {
        diagnosis: 'Cáncer de pulmón',
        user: { create: { role: 'PATIENT' } },
        physiotherapist: { connect: { id: physioA.physiotherapistId } },
      },
    });
    patientId = patient.id;
    userIds.push(patient.userId);
  });

  afterAll(async () => {
    await prisma.program.deleteMany({ where: { patientId } });
    await prisma.patient.deleteMany({ where: { id: patientId } });
    await prisma.routineTemplate.deleteMany({
      where: { id: { in: templateIds } },
    });
    await prisma.exercise.deleteMany({ where: { id: exerciseId } });
    await prisma.physiotherapist.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('is a shared library: one physio creates, another lists, edits and filters', async () => {
    const created = await createTemplate(template());
    expect(created.status).toBe(201);
    const body = created.body as TemplateBody;
    expect(body.exercises.map((l) => l.order)).toEqual([1, 2]);

    // Physio B sees it and can edit it
    const list = await http()
      .get('/api/routine-templates')
      .set(as(tokenB))
      .expect(200);
    expect((list.body as TemplateBody[]).map((t) => t.id)).toContain(body.id);

    const updated = await http()
      .put(`/api/routine-templates/${body.id}`)
      .set(as(tokenB))
      .send(
        template({
          name: 'Prehabilitación (B)',
          exercises: [line({ targetEffortPct: 60 })],
        }),
      )
      .expect(200);
    expect(updated.body).toMatchObject({
      name: 'Prehabilitación (B)',
      exercises: [{ order: 1, targetEffortPct: 60 }],
    });

    // Filter by profile
    await createTemplate(
      template({ name: 'Supervivientes E2E', profile: 'SURVIVOR' }),
    );
    const prehab = await http()
      .get('/api/routine-templates?profile=PREHAB')
      .set(as(tokenA))
      .expect(200);
    const profiles = (prehab.body as TemplateBody[]).map((t) => t.profile);
    expect(new Set(profiles)).toEqual(new Set(['PREHAB']));
    await http()
      .get('/api/routine-templates?profile=GYM')
      .set(as(tokenA))
      .expect(400);
  });

  it('validates exercise lines like a routine', async () => {
    expect((await createTemplate(template({ exercises: [] }))).status).toBe(
      400,
    );
    expect(
      (
        await createTemplate(
          template({ exercises: [line({ durationSec: 30 })] }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await createTemplate(
          template({ exercises: [line({ targetEffortPct: 45 })] }),
        )
      ).status,
    ).toBe(400);
    expect((await createTemplate(template({ name: '' }))).status).toBe(400);
  });

  it('records which template a routine came from, and survives deleting the template', async () => {
    const tpl = (await createTemplate(template({ name: 'Para borrar E2E' })))
      .body as TemplateBody;

    const program = await http()
      .post(`/api/patients/${patientId}/programs`)
      .set(as(tokenA))
      .send({
        name: 'Programa con plantilla',
        routines: [
          {
            name: 'Rutina A',
            templateId: tpl.id,
            daysOfWeek: ['MONDAY'],
            exercises: [line()],
          },
        ],
      })
      .expect(201);
    const routineId = (
      program.body as { routines: { id: string; templateId: string }[] }
    ).routines[0];
    expect(routineId.templateId).toBe(tpl.id);

    // The exercise is used by a template → can't be deleted
    await http()
      .delete(`/api/exercises/${exerciseId}`)
      .set(as(tokenA))
      .expect(409);

    await http()
      .delete(`/api/routine-templates/${tpl.id}`)
      .set(as(tokenB))
      .expect(204);
    await http()
      .get(`/api/routine-templates/${tpl.id}`)
      .set(as(tokenA))
      .expect(404);
    await http()
      .delete(`/api/routine-templates/${tpl.id}`)
      .set(as(tokenA))
      .expect(404);

    const routine = await prisma.routine.findUniqueOrThrow({
      where: { id: routineId.id },
      include: { exercises: true },
    });
    expect(routine.templateId).toBeNull(); // link cleared…
    expect(routine.exercises).toHaveLength(1); // …but the patient's routine is intact

    // A routine can't point to a template that doesn't exist
    await http()
      .post(`/api/patients/${patientId}/programs`)
      .set(as(tokenA))
      .send({
        name: 'X',
        routines: [
          {
            name: 'A',
            templateId: tpl.id,
            daysOfWeek: ['MONDAY'],
            exercises: [line()],
          },
        ],
      })
      .expect(400);
  });
});
