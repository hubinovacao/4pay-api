import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';
import { Comerciante } from './entities/comerciante.entity';
import { AtualizarComercianteDto, CriarComercianteDto } from './dto/comerciante.dto';

export interface ConsultaCnpjResultado {
  cnpj: string;
  razaoSocial: string | null;
  nomeFantasia: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
  telefone: string | null;
  email: string | null;
  situacao: string | null;
}

@Injectable()
export class ComerciantesService {
  private readonly logger = new Logger(ComerciantesService.name);

  constructor(@InjectRepository(Comerciante) private readonly repo: Repository<Comerciante>) {}

  async create(dto: CriarComercianteDto): Promise<Comerciante> {
    const c = this.repo.create({
      ...dto,
      documento: dto.documento ? this.somenteDigitos(dto.documento) : null,
      cep: dto.cep ? this.somenteDigitos(dto.cep) : null,
      uf: dto.uf?.toUpperCase() ?? null,
      ativo: dto.ativo ?? true,
    });
    return this.repo.save(c);
  }

  async update(id: string, dto: AtualizarComercianteDto): Promise<Comerciante> {
    const c = await this.findById(id);
    for (const [k, v] of Object.entries(dto)) {
      if (v === undefined) continue;
      if (k === 'documento' || k === 'cep') {
        (c as any)[k] = v ? this.somenteDigitos(v as string) : null;
      } else if (k === 'uf') {
        c.uf = (v as string).toUpperCase();
      } else {
        (c as any)[k] = v;
      }
    }
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

  /** Consulta CNPJ via BrasilAPI (grátis, sem auth). */
  async consultarCnpj(cnpj: string): Promise<ConsultaCnpjResultado> {
    const limpo = this.somenteDigitos(cnpj);
    if (limpo.length !== 14) {
      throw new BadGatewayException('CNPJ deve conter 14 dígitos');
    }
    try {
      const { data } = await axios.get(
        `https://brasilapi.com.br/api/cnpj/v1/${limpo}`,
        { timeout: 10_000 },
      );
      return {
        cnpj: limpo,
        razaoSocial: data.razao_social ?? null,
        nomeFantasia: data.nome_fantasia || data.razao_social || null,
        cep: data.cep ? this.somenteDigitos(String(data.cep)) : null,
        logradouro: this.montarLogradouro(data),
        numero: data.numero ?? null,
        complemento: data.complemento ?? null,
        bairro: data.bairro ?? null,
        municipio: data.municipio ?? null,
        uf: data.uf ?? null,
        telefone: data.ddd_telefone_1 ?? null,
        email: data.email ?? null,
        situacao: data.descricao_situacao_cadastral ?? null,
      };
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        throw new NotFoundException('CNPJ não encontrado na Receita Federal');
      }
      this.logger.error(`Falha consulta CNPJ ${limpo}: ${err?.message}`);
      throw new BadGatewayException('Falha ao consultar CNPJ na BrasilAPI');
    }
  }

  private montarLogradouro(data: any): string | null {
    const tipo = data?.descricao_tipo_logradouro;
    const log = data?.logradouro;
    if (!log) return null;
    return tipo ? `${tipo} ${log}` : String(log);
  }

  private somenteDigitos(s: string): string {
    return s.replace(/\D/g, '');
  }
}
