import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ComerciantesModule } from './comerciantes/comerciantes.module';
import { MaquininhasModule } from './maquininhas/maquininhas.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { GatewaysModule } from './gateways/gateways.module';
import { PagamentosModule } from './pagamentos/pagamentos.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { NfcModule } from './nfc/nfc.module';
import { BootstrapModule } from './bootstrap/bootstrap.module';

import { Usuario } from './usuarios/entities/usuario.entity';
import { Comerciante } from './comerciantes/entities/comerciante.entity';
import { Maquininha } from './maquininhas/entities/maquininha.entity';
import { Integration } from './integrations/entities/integration.entity';
import { Pagamento } from './pagamentos/entities/pagamento.entity';
import { EventoWebhook } from './webhooks/entities/evento-webhook.entity';
import { LeituraNfc } from './nfc/entities/leitura-nfc.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'mysql',
        host: cfg.get<string>('DB_HOST', 'localhost'),
        port: Number(cfg.get<string>('DB_PORT', '3306')),
        username: cfg.get<string>('DB_USERNAME', 'root'),
        password: cfg.get<string>('DB_PASSWORD', ''),
        database: cfg.get<string>('DB_NAME', '4pay'),
        entities: [Usuario, Comerciante, Maquininha, Integration, Pagamento, EventoWebhook, LeituraNfc],
        synchronize: cfg.get<string>('DB_SYNC', 'false') === 'true',
        charset: 'utf8mb4_unicode_ci',
        timezone: 'Z',
      }),
    }),
    AuthModule,
    UsuariosModule,
    ComerciantesModule,
    MaquininhasModule,
    IntegrationsModule,
    GatewaysModule,
    PagamentosModule,
    WebhooksModule,
    NfcModule,
    BootstrapModule,
  ],
})
export class AppModule {}
