import { Injectable, NotFoundException } from '@nestjs/common';
import { DistritoSanitario } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class UbsService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(distrito?: DistritoSanitario, bairro?: string, especialidadeId?: string) {
    return this.prisma.ubs.findMany({
      where: {
        ativo: true,
        distritoSanitario: distrito ? distrito : undefined,
        bairro: bairro ? { contains: bairro } : undefined,
        especialidades: especialidadeId
          ? {
              some: {
                especialidadeId,
              },
            }
          : undefined,
      },
      include: {
        especialidades: {
          include: {
            especialidade: true,
          },
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async obterPorId(id: string) {
    const ubs = await this.prisma.ubs.findUnique({
      where: { id },
      include: {
        especialidades: {
          include: {
            especialidade: true,
          },
        },
      },
    });

    if (!ubs || !ubs.ativo) {
      throw new NotFoundException('Unidade Básica de Saúde não encontrada.');
    }

    return ubs;
  }

  async listarEspecialidades() {
    return this.prisma.especialidade.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });
  }
}
