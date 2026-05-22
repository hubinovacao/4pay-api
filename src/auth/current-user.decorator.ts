import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JwtUser } from './auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    if (!req.user) throw new Error('JwtAuthGuard ausente nesta rota');
    return req.user;
  },
);
