import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtUser, UserRole } from './auth.types';

const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required?.length) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    const user = req.user;
    if (!user) throw new ForbiddenException('Sem usuário autenticado');
    if (!required.includes(user.role)) {
      throw new ForbiddenException(`Acesso restrito (requer: ${required.join(' | ')})`);
    }
    return true;
  }
}
