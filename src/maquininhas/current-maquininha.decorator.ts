import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { MaquininhaPrincipal } from '../auth/auth.types';

export const CurrentMaquininha = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): MaquininhaPrincipal => {
    const req = ctx.switchToHttp().getRequest<Request & { maquininha?: MaquininhaPrincipal }>();
    if (!req.maquininha) throw new Error('MaquininhaAuthGuard ausente nesta rota');
    return req.maquininha;
  },
);
