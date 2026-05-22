import { Module } from '@nestjs/common';
import { IntegrationsModule } from '../integrations/integrations.module';
import { GatewayRouterService } from './gateway-router.service';
import { MercadoPagoGateway } from './mercadopago.gateway';
import { SicoobGateway } from './sicoob.gateway';

@Module({
  imports: [IntegrationsModule],
  providers: [MercadoPagoGateway, SicoobGateway, GatewayRouterService],
  exports: [MercadoPagoGateway, SicoobGateway, GatewayRouterService],
})
export class GatewaysModule {}
