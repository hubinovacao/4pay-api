import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comerciante } from './entities/comerciante.entity';
import { ComerciantesService } from './comerciantes.service';
import { ComerciantesController } from './comerciantes.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comerciante]), AuthModule],
  controllers: [ComerciantesController],
  providers: [ComerciantesService],
  exports: [ComerciantesService],
})
export class ComerciantesModule {}
