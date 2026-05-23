import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Integration } from './entities/integration.entity';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { CryptoService } from './crypto.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Integration]), AuthModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, CryptoService],
  exports: [IntegrationsService, CryptoService],
})
export class IntegrationsModule {}
