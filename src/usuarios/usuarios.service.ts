import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { scrypt as scryptCb, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { Usuario } from './entities/usuario.entity';
import { UserRole } from '../auth/auth.types';

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

export interface CriarUsuarioInput {
  email: string;
  nome: string;
  senha: string;
  role: UserRole;
  comercianteId?: string | null;
}

@Injectable()
export class UsuariosService {
  constructor(@InjectRepository(Usuario) private readonly repo: Repository<Usuario>) {}

  async create(input: CriarUsuarioInput): Promise<Usuario> {
    const existente = await this.repo.findOne({ where: { email: input.email } });
    if (existente) throw new ConflictException('E-mail já cadastrado');

    const senhaHash = await this.hashPassword(input.senha);
    const u = this.repo.create({
      email: input.email.toLowerCase(),
      nome: input.nome,
      senhaHash,
      role: input.role,
      comercianteId: input.comercianteId ?? null,
      ativo: true,
    });
    return this.repo.save(u);
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.repo.findOne({ where: { email: email.toLowerCase() } });
  }

  async findById(id: string): Promise<Usuario> {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('Usuário não encontrado');
    return u;
  }

  async marcarLogin(id: string): Promise<void> {
    await this.repo.update(id, { ultimoLogin: new Date() });
  }

  async listar(): Promise<Usuario[]> {
    return this.repo.find({ order: { criadoEm: 'DESC' } });
  }

  async verificarSenha(u: Usuario, senha: string): Promise<boolean> {
    const [salt, hash] = u.senhaHash.split(':');
    if (!salt || !hash) return false;
    const derived = await scrypt(senha, Buffer.from(salt, 'hex'), 64);
    const stored = Buffer.from(hash, 'hex');
    if (derived.length !== stored.length) return false;
    return timingSafeEqual(derived, stored);
  }

  private async hashPassword(senha: string): Promise<string> {
    const salt = randomBytes(16);
    const derived = await scrypt(senha, salt, 64);
    return `${salt.toString('hex')}:${derived.toString('hex')}`;
  }
}
