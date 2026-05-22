import { Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { BootstrapSuperService } from './bootstrap-super.service';

@Module({
  imports: [UsuariosModule],
  providers: [BootstrapSuperService],
})
export class BootstrapModule {}
