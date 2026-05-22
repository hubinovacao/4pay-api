import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsuariosService } from '../usuarios/usuarios.service';

/**
 * Garante que existe um usuário super-admin no banco.
 * Lê `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_SENHA` do env. Se o e-mail já existe, não faz nada.
 */
@Injectable()
export class BootstrapSuperService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BootstrapSuperService.name);

  constructor(
    private readonly cfg: ConfigService,
    private readonly usuarios: UsuariosService,
  ) {}

  async onApplicationBootstrap() {
    const email = this.cfg.get<string>('SUPER_ADMIN_EMAIL');
    const senha = this.cfg.get<string>('SUPER_ADMIN_SENHA');
    if (!email || !senha) {
      this.logger.warn('SUPER_ADMIN_EMAIL/SENHA não definidos — pulando bootstrap');
      return;
    }

    const existente = await this.usuarios.findByEmail(email);
    if (existente) return;

    await this.usuarios.create({
      email,
      nome: 'Super Admin',
      senha,
      role: 'super',
      comercianteId: null,
    });
    this.logger.log(`Super admin criado: ${email}`);
  }
}
