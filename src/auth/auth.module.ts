import { Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtService } from './jwt.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [UsuariosModule],
  controllers: [AuthController],
  providers: [AuthService, JwtService, JwtAuthGuard, RolesGuard],
  exports: [JwtService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
