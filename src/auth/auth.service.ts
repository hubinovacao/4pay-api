import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service';
import { JwtService } from './jwt.service';
import { JwtUser } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarios: UsuariosService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, senha: string): Promise<{ token: string; user: JwtUser }> {
    const u = await this.usuarios.findByEmail(email);
    if (!u || !u.ativo) throw new UnauthorizedException('Credenciais inválidas');

    const ok = await this.usuarios.verificarSenha(u, senha);
    if (!ok) throw new UnauthorizedException('Credenciais inválidas');

    await this.usuarios.marcarLogin(u.id);

    const principal: JwtUser = {
      sub: u.id,
      email: u.email,
      role: u.role,
      comercianteId: u.comercianteId,
    };
    return { token: this.jwt.sign(principal), user: principal };
  }
}
