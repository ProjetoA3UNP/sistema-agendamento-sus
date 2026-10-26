import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.perfil) {
      throw new ForbiddenException('Usuário não autenticado ou perfil não informado.');
    }

    const hasRole = requiredRoles.includes(user.perfil as Role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Acesso negado. Ação restrita aos perfis: ${requiredRoles.join(', ')} (Seu perfil atual: ${user.perfil})`,
      );
    }

    return true;
  }
}
