import {
  Controller,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';
import { GatewayTipo } from '../gateways/payment-gateway.interface';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly svc: WebhooksService) {}

  @Post(':provider')
  @HttpCode(200)
  async receive(
    @Param('provider') provider: string,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ) {
    if (provider !== 'mercadopago' && provider !== 'sicoob') {
      return { ok: false, motivo: 'provider desconhecido' };
    }
    const raw = (req.body as Buffer) ?? Buffer.alloc(0);
    return this.svc.receber(provider as GatewayTipo, headers, raw);
  }
}
