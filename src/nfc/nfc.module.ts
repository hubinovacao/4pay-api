import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeituraNfc } from './entities/leitura-nfc.entity';
import { NfcService } from './nfc.service';
import { NfcController } from './nfc.controller';
import { MaquininhasModule } from '../maquininhas/maquininhas.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([LeituraNfc]), MaquininhasModule, AuthModule],
  controllers: [NfcController],
  providers: [NfcService],
})
export class NfcModule {}
