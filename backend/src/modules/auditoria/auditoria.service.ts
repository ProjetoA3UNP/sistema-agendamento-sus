import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface RegistrarLogParams {
  usuarioId?: string;
  acao: string;
  entidade: string;
  entidadeId?: string;
  detalhesJson?: Record<string, any>;
  ip?: string;
}

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(params: RegistrarLogParams): Promise<void> {
    try {
      await this.prisma.logAuditoria.create({
        data: {
          usuarioId: params.usuarioId ?? null,
          acao: params.acao,
          entidade: params.entidade,
          entidadeId: params.entidadeId ?? null,
          detalhesJson: params.detalhesJson ? JSON.stringify(params.detalhesJson) : null,
          ip: params.ip ?? null,
        },
      });
    } catch (error) {
      // Falhas de log não devem derrubar a requisição principal, mas são registradas no console
      console.error('❌ Erro ao gravar log de auditoria LGPD:', error);
    }
  }
}
