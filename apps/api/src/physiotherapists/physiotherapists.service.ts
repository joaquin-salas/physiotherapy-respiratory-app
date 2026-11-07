import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PhysiotherapistsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.physiotherapist.findMany({
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' },
    });
  }
}
