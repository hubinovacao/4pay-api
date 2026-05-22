import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Maquininha } from './entities/maquininha.entity';
import { AtualizarMaquininhaDto, CriarMaquininhaDto } from './dto/maquininha.dto';

@Injectable()
export class MaquininhasService {
  constructor(@InjectRepository(Maquininha) private readonly repo: Repository<Maquininha>) {}

  async create(dto: CriarMaquininhaDto): Promise<Maquininha & { apiTokenPlain: string }> {
    const existente = await this.repo.findOne({ where: { serial: dto.serial } });
    if (existente) throw new ConflictException('Serial já cadastrado');

    const apiTokenPlain = this.gerarToken();
    const m = this.repo.create({
      comercianteId: dto.comercianteId,
      nome: dto.nome,
      serial: dto.serial,
      apiToken: apiTokenPlain,
      ativa: dto.ativa ?? false,
    });
    const saved = await this.repo.save(m);
    return Object.assign(saved, { apiTokenPlain });
  }

  async update(id: string, dto: AtualizarMaquininhaDto): Promise<Maquininha> {
    const m = await this.findById(id);
    if (dto.nome !== undefined) m.nome = dto.nome;
    if (dto.ativa !== undefined) m.ativa = dto.ativa;
    return this.repo.save(m);
  }

  async findById(id: string): Promise<Maquininha> {
    const m = await this.repo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Maquininha não encontrada');
    return m;
  }

  async listar(comercianteId?: string): Promise<Maquininha[]> {
    const where = comercianteId ? { comercianteId } : {};
    return this.repo.find({ where, order: { criadoEm: 'DESC' } });
  }

  async rotacionarToken(id: string): Promise<{ apiTokenPlain: string }> {
    const m = await this.findById(id);
    m.apiToken = this.gerarToken();
    await this.repo.save(m);
    return { apiTokenPlain: m.apiToken };
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException('Maquininha não encontrada');
  }

  /** Autentica uma maquininha pelo header X-Maquininha-Token. */
  async autenticar(token: string): Promise<Maquininha> {
    const m = await this.repo.findOne({ where: { apiToken: token } });
    if (!m) throw new UnauthorizedException('Token de maquininha inválido');
    if (!m.ativa) throw new UnauthorizedException('Maquininha desativada');
    m.ultimoHeartbeat = new Date();
    await this.repo.save(m);
    return m;
  }

  private gerarToken(): string {
    return `mq_${randomBytes(24).toString('hex')}`;
  }
}
