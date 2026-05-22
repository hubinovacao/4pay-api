import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoWebhook } from './entities/evento-webhook.entity';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { GatewaysModule } from '../gateways/gateways.module';
import { PagamentosModule } from '../pagamentos/pagamentos.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventoWebhook]),
    GatewaysModule,
    PagamentosModule,
    IntegrationsModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
