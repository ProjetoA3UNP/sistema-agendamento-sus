import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service.js';

export interface JwtPayload {
  sub: string;
  email: string;
  perfil: string;
  nome: string;
  cpf: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'sus_natal_secret_jwt_key_development_only_2026',
    });
  }

  async validate(payload: JwtPayload) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        nome: true,
        cpf: true,
        email: true,
        perfil: true,
        ativo: true,
        bairro: true,
        cartaoSus: true,
      },
    });

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Acesso negado ou conta inativa no sistema.');
    }

    return usuario;
  }
}
