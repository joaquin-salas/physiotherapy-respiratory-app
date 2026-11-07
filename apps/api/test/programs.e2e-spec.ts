import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { generateToken, hashToken } from '../src/auth/session-token.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// All data here is fake and deleted after the tests

interface LineBody {
  id: string;
  order: number;
  reps: number | null;
  targetEffortPct: number | null;
}
interface RoutineBody {
  id: string;
  name: string;
  order: number;
  daysOfWeek: string[];
  exercises: LineBody[];
}
interface ProgramBody {
  id: string;
  status: 'ACTIVE' | 'ENDED';
  endDate: string | null;
  routines: RoutineBody[];
}

describe('Programs (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const userIds: string[] = [];
  const exerciseIds: string[] = [];
  let tokenA: string;
  let tokenB: string;
  let patientId: string;

  const http = () => request(app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  /** A physio user with a valid session */
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

  const line = (exerciseId: string, extra: object = {}) => ({
    exerciseId,
    sets: 3,
    reps: 10,
    restSec: 60,
    targetEffortPct: 50,
    ...extra,
  });

  const routine = (days: string[], lines: object[], extra: object = {}) => ({
    name: 'Rutina',
    daysOfWeek: days,
    exercises: lines,
    ...extra,
  });

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

    for (const name of ['Soplar pajita E2E', 'Caminar E2E']) {
      const exercise = await prisma.exercise.create({
        data: { name, description: 'Prueba', goal: 'RESPIRATORY' },
      });
      exerciseIds.push(exercise.id);
    }

    const patient = await prisma.patient.create({
      data: {
        diagnosis: 'Cáncer de pulmón',
        user: { create: { role: 'PATIENT' } },
        physiotherapist: { connect: { id: physioA.physiotherapistId } },
        identity: {
          create: {
            fullName: 'Paciente Ficticio',
            birthDate: new Date('1950-01-01'),
          },
        },
      },
    });
    patientId = patient.id;
    userIds.push(patient.userId);
  });

  afterAll(async () => {
    await prisma.program.deleteMany({ where: { patientId } }); // routines and lines cascade
    await prisma.patient.deleteMany({ where: { id: patientId } });
    await prisma.exercise.deleteMany({ where: { id: { in: exerciseIds } } });
    await prisma.physiotherapist.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  const createProgram = (body: object, token = tokenA) =>
    http()
      .post(`/api/patients/${patientId}/programs`)
      .set(as(token))
      .send(body);

  const simpleProgram = (name = 'X') => ({
    name,
    routines: [routine(['MONDAY'], [line(exerciseIds[0])])],
  });

  it('assigns a program with two routines; a new program ends the previous one', async () => {
    const first = await createProgram({
      name: 'Prehabilitación',
      profile: 'PREHAB',
      routines: [
        routine(
          ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
          [
            line(exerciseIds[0]),
            line(exerciseIds[1], { reps: null, durationSec: 600 }),
          ],
          { name: 'Rutina A' },
        ),
        routine(['TUESDAY', 'THURSDAY'], [line(exerciseIds[0])], {
          name: 'Rutina B',
        }),
      ],
    }).expect(201);
    const firstBody = first.body as ProgramBody;
    expect(firstBody.status).toBe('ACTIVE');
    expect(firstBody.routines.map((r) => r.name)).toEqual([
      'Rutina A',
      'Rutina B',
    ]);
    expect(firstBody.routines[0].exercises.map((l) => l.order)).toEqual([1, 2]);
    expect(firstBody.routines[0].exercises[0].targetEffortPct).toBe(50);

    const second = await createProgram(simpleProgram('Postcirugía')).expect(
      201,
    );

    const list = await http()
      .get(`/api/patients/${patientId}/programs`)
      .set(as(tokenA))
      .expect(200);
    const programs = list.body as ProgramBody[];
    expect(programs[0].id).toBe((second.body as ProgramBody).id); // active first
    expect(programs.filter((p) => p.status === 'ACTIVE')).toHaveLength(1);
    const ended = programs.find((p) => p.id === firstBody.id)!;
    expect(ended.status).toBe('ENDED');
    expect(ended.endDate).not.toBeNull();

    // Ended programs are read-only
    await http()
      .put(`/api/programs/${firstBody.id}`)
      .set(as(tokenA))
      .send(simpleProgram())
      .expect(409);
  });

  it('edits a program keeping the ids of existing routines and lines', async () => {
    const { body } = await createProgram({
      name: 'Durante tratamiento',
      routines: [
        routine(['MONDAY'], [line(exerciseIds[0]), line(exerciseIds[1])], {
          name: 'Rutina A',
        }),
        routine(['FRIDAY'], [line(exerciseIds[0])], { name: 'Rutina B' }),
      ],
    }).expect(201);
    const program = body as ProgramBody;
    const [routineA, routineB] = program.routines;
    const [keptLine, removedLine] = routineA.exercises;

    const updated = await http()
      .put(`/api/programs/${program.id}`)
      .set(as(tokenA))
      .send({
        name: 'Durante tratamiento (ajustado)',
        routines: [
          {
            id: routineA.id,
            name: 'Rutina A',
            daysOfWeek: ['MONDAY', 'THURSDAY'],
            exercises: [
              line(exerciseIds[1]), // new line, now first
              {
                ...line(exerciseIds[0], { targetEffortPct: 70 }),
                id: keptLine.id,
              },
            ],
          },
          // Rutina B is removed
        ],
      })
      .expect(200);
    const routines = (updated.body as ProgramBody).routines;
    expect(routines).toHaveLength(1);
    expect(routines[0]).toMatchObject({
      id: routineA.id,
      daysOfWeek: ['MONDAY', 'THURSDAY'],
    });
    expect(routines[0].exercises[1]).toMatchObject({
      id: keptLine.id,
      order: 2,
      targetEffortPct: 70,
    });
    expect(routines[0].exercises.map((l) => l.id)).not.toContain(
      removedLine.id,
    );

    // A line from another routine, or a routine from elsewhere, is rejected
    const put = (routines: object[]) =>
      http()
        .put(`/api/programs/${program.id}`)
        .set(as(tokenA))
        .send({ name: 'X', routines });
    await put([
      routine(['MONDAY'], [{ ...line(exerciseIds[0]), id: removedLine.id }], {
        id: routineA.id,
      }),
    ]).expect(400);
    await put([
      routine(['MONDAY'], [line(exerciseIds[0])], { id: routineB.id }),
    ]).expect(400); // routine B was deleted
  });

  it('validates routines and lines', async () => {
    const withLine = (extra: object) =>
      createProgram({
        name: 'X',
        routines: [routine(['MONDAY'], [line(exerciseIds[0], extra)])],
      });

    await withLine({ durationSec: 60 }).expect(400); // reps AND duration
    await withLine({ reps: null }).expect(400); // neither
    await withLine({ targetEffortPct: 55 }).expect(400); // steps of 10
    await withLine({ targetEffortPct: 110 }).expect(400);

    const withRoutines = (routines: object[]) =>
      createProgram({ name: 'X', routines });
    const ok = [line(exerciseIds[0])];

    await withRoutines([]).expect(400);
    await withRoutines([routine([], ok)]).expect(400); // no days
    await withRoutines([routine(['FUNDAY'], ok)]).expect(400);
    await withRoutines([routine(['MONDAY'], [])]).expect(400); // no exercises
    await withRoutines([
      routine(['MONDAY', 'FRIDAY'], ok),
      routine(['FRIDAY'], ok),
    ]).expect(400); // Friday in two routines
    await withRoutines([
      routine(['MONDAY'], ok),
      routine(['TUESDAY'], ok),
      routine(['WEDNESDAY'], ok),
    ]).expect(400); // more than 2 routines
    await withRoutines([
      routine(['MONDAY'], [line('00000000-0000-4000-8000-000000000000')]),
    ]).expect(400); // exercise doesn't exist
  });

  it("hides another physio's patient programs", async () => {
    await http()
      .get(`/api/patients/${patientId}/programs`)
      .set(as(tokenB))
      .expect(404);
    await createProgram(simpleProgram(), tokenB).expect(404);

    const active = await prisma.program.findFirstOrThrow({
      where: { patientId, status: 'ACTIVE' },
    });
    await http().get(`/api/programs/${active.id}`).set(as(tokenB)).expect(404);
    await http()
      .post(`/api/programs/${active.id}/end`)
      .set(as(tokenB))
      .expect(404);
  });

  it('refuses to delete an exercise used in a program (409)', async () => {
    await http()
      .delete(`/api/exercises/${exerciseIds[0]}`)
      .set(as(tokenA))
      .expect(409);
  });

  it('ends the active program when the follow-up ends', async () => {
    await http()
      .post(`/api/patients/${patientId}/discharge`)
      .set(as(tokenA))
      .expect(200);

    const active = await prisma.program.count({
      where: { patientId, status: 'ACTIVE' },
    });
    expect(active).toBe(0);

    // No new programs for a patient whose follow-up has ended
    await createProgram(simpleProgram()).expect(409);
  });
});
