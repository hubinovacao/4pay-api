import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Maquininha } from './entities/maquininha.entity';
import { MaquininhasService } from './maquininhas.service';
import { MaquininhasController } from './maquininhas.controller';
import { MaquininhaAuthGuard } from './maquininha-auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Maquininha]), AuthModule],
  controllers: [MaquininhasController],
  providers: [MaquininhasService, MaquininhaAuthGuard],
  exports: [MaquininhasService, MaquininhaAuthGuard],
})
export class MaquininhasModule {}
