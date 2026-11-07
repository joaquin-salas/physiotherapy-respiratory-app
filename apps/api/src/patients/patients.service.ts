import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth.decorators.js';
import { Prisma, ProgramStatus, UserRole } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePatientDto } from './dto/create-patient.dto.js';
import {
  UpdatePatientDto,
  UpdatePatientIdentityDto,
} from './dto/update-patient.dto.js';
import { normalizeNationalId, normalizePhone } from './patient-validation.js';

/** What every patient response includes */
const patientInclude = {
  identity: true,
  physiotherapist: { select: { id: true, fullName: true } },
} satisfies Prisma.PatientInclude;

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser, status: 'active' | 'discharged' = 'active') {
    return this.prisma.patient.findMany({
      where: {
        ...this.visibleTo(user),
        dischargedAt: status === 'active' ? null : { not: null },
      },
      include: patientInclude,
      orderBy: { identity: { fullName: 'asc' } },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, ...this.visibleTo(user) },
      include: patientInclude,
    });
    // Same 404 whether it doesn't exist or belongs to another physio:
    // never confirm that someone else's patient exists
    if (!patient) throw new NotFoundException(`Patient ${id} not found`);
    return patient;
  }

  /** Creates the patient's login account (no password yet), clinical profile and identity together */
  async create(user: AuthUser, dto: CreatePatientDto) {
    const physiotherapistId = await this.resolvePhysiotherapist(
      user,
      dto.physiotherapistId,
    );

    try {
      return await this.prisma.patient.create({
        data: {
          ...clinicalData(dto),
          diagnosis: dto.diagnosis,
          user: { create: { role: UserRole.PATIENT } },
          physiotherapist: { connect: { id: physiotherapistId } },
          identity: {
            create: {
              ...identityData(dto.identity),
              fullName: dto.identity.fullName,
              birthDate: new Date(dto.identity.birthDate),
            },
          },
        },
        include: patientInclude,
      });
    } catch (error) {
      throw duplicateNationalIdOr(error);
    }
  }

  async update(user: AuthUser, id: string, dto: UpdatePatientDto) {
    await this.findOne(user, id); // 404 if not visible to this user

    const physiotherapistId =
      dto.physiotherapistId === undefined
        ? undefined
        : await this.resolvePhysiotherapist(user, dto.physiotherapistId);

    try {
      return await this.prisma.patient.update({
        where: { id },
        data: {
          ...clinicalData(dto),
          physiotherapist: physiotherapistId
            ? { connect: { id: physiotherapistId } }
            : undefined,
          identity: dto.identity
            ? { update: identityData(dto.identity) }
            : undefined,
        },
        include: patientInclude,
      });
    } catch (error) {
      throw duplicateNationalIdOr(error);
    }
  }

  /**
   * Discharge ("Finalizar seguimiento" in the UI): hidden from the active list,
   * active program ended, app access revoked, data kept.
   */
  async discharge(user: AuthUser, id: string) {
    const patient = await this.findOne(user, id);
    if (patient.dischargedAt) return patient;

    await this.prisma.$transaction([
      this.prisma.patient.update({
        where: { id },
        data: { dischargedAt: new Date() },
      }),
      this.prisma.program.updateMany({
        where: { patientId: id, status: ProgramStatus.ACTIVE },
        data: { status: ProgramStatus.ENDED, endDate: new Date() },
      }),
      this.prisma.user.update({
        where: { id: patient.userId },
        data: { isActive: false },
      }),
      this.prisma.session.updateMany({
        where: { userId: patient.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return this.findOne(user, id);
  }

  /** Undo a discharge. The patient will need to pair their device again. */
  async reactivate(user: AuthUser, id: string) {
    const patient = await this.findOne(user, id);
    if (!patient.dischargedAt) return patient;

    await this.prisma.$transaction([
      this.prisma.patient.update({
        where: { id },
        data: { dischargedAt: null },
      }),
      this.prisma.user.update({
        where: { id: patient.userId },
        data: { isActive: true },
      }),
    ]);
    return this.findOne(user, id);
  }

  /**
   * Admins see every patient; physios only their own.
   * Public so other modules (programs) apply exactly the same rule.
   */
  visibleTo(user: AuthUser): Prisma.PatientWhereInput {
    if (user.role === UserRole.ADMIN) return {};
    if (!user.physiotherapistId) throw new ForbiddenException();
    return { physiotherapistId: user.physiotherapistId };
  }

  /** Which physio a patient is assigned to: admins choose, physios are always themselves */
  private async resolvePhysiotherapist(user: AuthUser, requested?: string) {
    if (user.role !== UserRole.ADMIN) {
      if (requested !== undefined && requested !== user.physiotherapistId) {
        throw new ForbiddenException(
          'Only an admin can assign a patient to another physiotherapist',
        );
      }
      if (!user.physiotherapistId) throw new ForbiddenException();
      return user.physiotherapistId;
    }

    if (!requested) {
      throw new BadRequestException('physiotherapistId is required');
    }
    const exists = await this.prisma.physiotherapist.count({
      where: { id: requested },
    });
    if (!exists) {
      throw new BadRequestException(`Physiotherapist ${requested} not found`);
    }
    return requested;
  }
}

/** Clinical fields from a create/update body (undefined = leave unchanged) */
function clinicalData(dto: UpdatePatientDto) {
  return {
    sex: dto.sex,
    weightKg: dto.weightKg,
    heightCm: dto.heightCm,
    diagnosis: dto.diagnosis ?? undefined, // required: null is ignored
    stage: emptyToNull(dto.stage),
    currentTreatment: emptyToNull(dto.currentTreatment),
    surgeryDate: toDate(dto.surgeryDate),
    comorbidities: dto.comorbidities,
    initialAssessment: emptyToNull(dto.initialAssessment),
  };
}

function identityData(dto: UpdatePatientIdentityDto) {
  return {
    fullName: dto.fullName ?? undefined, // required: null is ignored
    birthDate: toDate(dto.birthDate) ?? undefined,
    phone: emptyToNull(dto.phone && normalizePhone(dto.phone)),
    nationalId: emptyToNull(
      dto.nationalId && normalizeNationalId(dto.nationalId),
    ),
  };
}

/** "YYYY-MM-DD" → Date, keeping undefined (no change) and null (clear) as they are */
function toDate(value: string | null | undefined) {
  if (value === undefined || value === null) return value;
  return new Date(value);
}

/** Trims text; an empty string is stored as null */
function emptyToNull(value: string | null | undefined) {
  if (value === undefined || value === null) return value;
  return value.trim() || null;
}

// Prisma error P2002 = unique constraint violated (here, the DNI/NIE)
function duplicateNationalIdOr(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    return new ConflictException(
      'A patient with this national ID already exists',
    );
  }
  return error;
}
