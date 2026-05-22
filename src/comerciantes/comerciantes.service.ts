import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comerciante } from './entities/comerciante.entity';
import { AtualizarComercianteDto, CriarComercianteDto } from './dto/comerciante.dto';

@Injectable()
export class ComerciantesService {
  constructor(@InjectRepository(Comerciante) private readonly repo: Repository<Comerciante>) {}

  async create(dto: CriarComercianteDto): Promise<Comerciante> {
    const c = this.repo.create({
      nome: dto.nome,
      documento: dto.documento ?? null,
      ativo: dto.ativo ?? true,
    });
    return this.repo.save(c);
  }

  async update(id: string, dto: AtualizarComercianteDto): Promise<Comerciante> {
    const c = await this.findById(id);
    if (dto.nome !== undefined) c.nome = dto.nome;
    if (dto.documento !== undefined) c.documento = dto.documento ?? null;
    if (dto.ativo !== undefined) c.ativo = dto.ativo;
    return this.repo.save(c);
  }

  async findById(id: string): Promise<Comerciante> {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Comerciante não encontrado');
    return c;
  }

  async listar(): Promise<Comerciante[]> {
    return this.repo.find({ order: { criadoEm: 'DESC' } });
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException('Comerciante não encontrado');
  }
}
