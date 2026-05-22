import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { MaquininhasService } from './maquininhas.service';
import { MaquininhaPrincipal } from '../auth/auth.types';

/**
 * Guard usado em rotas chamadas pela maquininha (Flutter).
 * Espera header: `X-Maquininha-Token: mq_...`
 */
@Injectable()
export class MaquininhaAuthGuard implements CanActivate {
  constructor(private readonly maquininhas: MaquininhasService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const token =
      (req.headers['x-maquininha-token'] as string | undefined) ??
      (req.headers['X-Maquininha-Token'] as unknown as string | undefined);
    if (!token) throw new UnauthorizedException('Token de maquininha ausente');

    const m = await this.maquininhas.autenticar(token);
    (req as any).maquininha = {
      type: 'maquininha',
      maquininhaId: m.id,
      comercianteId: m.comercianteId,
    } satisfies MaquininhaPrincipal;
    return true;
  }
}
