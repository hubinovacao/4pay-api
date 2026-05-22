import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptoService } from './crypto.service';
import {
  GatewayEnvironment,
  GatewayProvider,
  Integration,
} from './entities/integration.entity';

export interface IntegrationCreateInput {
  comercianteId: string;
  provider: GatewayProvider;
  environment: GatewayEnvironment;
  apelido?: string;
  credenciais: Record<string, string>;
  percentual?: number;
  prioridade?: number;
  habilitado?: boolean;
  atualizadoPor?: string;
}

export interface IntegrationUpdateInput {
  apelido?: string;
  credenciais?: Record<string, string>;
  percentual?: number;
  prioridade?: number;
  habilitado?: boolean;
  atualizadoPor?: string;
}

export interface IntegrationPublicView {
  id: string;
  comercianteId: string;
  provider: GatewayProvider;
  environment: GatewayEnvironment;
  apelido: string | null;
  percentual: number;
  prioridade: number;
  habilitado: boolean;
  credenciaisMascaradas: Record<string, string | null>;
  atualizadoPor: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectRepository(Integration) private readonly repo: Repository<Integration>,
    private readonly crypto: CryptoService,
  ) {}

  async create(input: IntegrationCreateInput): Promise<IntegrationPublicView> {
    await this.validarPercentual(input.comercianteId, input.percentual ?? 0);

    const integ = this.repo.create({
      comercianteId: input.comercianteId,
      provider: input.provider,
      environment: input.environment,
      apelido: input.apelido ?? null,
      credenciaisCifradas: this.crypto.encrypt(JSON.stringify(input.credenciais)),
      percentual: input.percentual ?? 0,
      prioridade: input.prioridade ?? 0,
      habilitado: input.habilitado ?? true,
      atualizadoPor: input.atualizadoPor ?? null,
    });

    const saved = await this.repo.save(integ);
    return this.toPublicView(saved, input.credenciais);
  }

  async update(id: string, input: IntegrationUpdateInput): Promise<IntegrationPublicView> {
    const integ = await this.repo.findOne({ where: { id } });
    if (!integ) throw new NotFoundException('Integration não encontrada');

    if (input.percentual !== undefined) {
      await this.validarPercentual(integ.comercianteId, input.percentual, id);
      integ.percentual = input.percentual;
    }
    if (input.prioridade !== undefined) integ.prioridade = input.prioridade;
    if (input.habilitado !== undefined) integ.habilitado = input.habilitado;
    if (input.apelido !== undefined) integ.apelido = input.apelido ?? null;
    if (input.atualizadoPor !== undefined) integ.atualizadoPor = input.atualizadoPor ?? null;

    let creds: Record<string, string> | null = null;
    if (input.credenciais) {
      creds = input.credenciais;
      integ.credenciaisCifradas = this.crypto.encrypt(JSON.stringify(creds));
    }

    const saved = await this.repo.save(integ);
    return this.toPublicView(saved, creds ?? this.readCredenciais(saved));
  }

  async listByComerciante(comercianteId: string): Promise<IntegrationPublicView[]> {
    const items = await this.repo.find({
      where: { comercianteId },
      order: { provider: 'ASC', criadoEm: 'ASC' },
    });
    return items.map((i) => this.toPublicView(i, this.readCredenciais(i)));
  }

  async listAtivos(comercianteId: string): Promise<Integration[]> {
    return this.repo.find({
      where: { comercianteId, habilitado: true },
      order: { prioridade: 'DESC', criadoEm: 'ASC' },
    });
  }

  /** Lista todas as integrações habilitadas de um provider (multi-tenant, usado pelo webhook). */
  async repoListByProvider(provider: GatewayProvider): Promise<Integration[]> {
    return this.repo.find({
      where: { provider, habilitado: true },
      order: { criadoEm: 'ASC' },
    });
  }

  async findById(id: string): Promise<Integration> {
    const i = await this.repo.findOne({ where: { id } });
    if (!i) throw new NotFoundException('Integration não encontrada');
    return i;
  }

  /** Decifra credenciais da integração — uso interno (gateway router, webhook). */
  readCredenciais(i: Integration): Record<string, string> {
    return JSON.parse(this.crypto.decrypt(i.credenciaisCifradas));
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException('Integration não encontrada');
  }

  private async validarPercentual(
    comercianteId: string,
    novoPercentual: number,
    ignoreId?: string,
  ) {
    if (novoPercentual < 0 || novoPercentual > 100) {
      throw new BadRequestException('Percentual deve estar entre 0 e 100');
    }
    const ativos = await this.listAtivos(comercianteId);
    const soma = ativos
      .filter((i) => i.id !== ignoreId)
      .reduce((acc, i) => acc + i.percentual, novoPercentual);
    if (soma > 100) {
      throw new BadRequestException(
        `Soma dos percentuais ativos excede 100% (resultaria em ${soma}%).`,
      );
    }
  }

  private toPublicView(
    i: Integration,
    credenciais: Record<string, string>,
  ): IntegrationPublicView {
    const credenciaisMascaradas: Record<string, string | null> = {};
    for (const k of Object.keys(credenciais)) {
      credenciaisMascaradas[k] = this.crypto.mask(credenciais[k]);
    }
    return {
      id: i.id,
      comercianteId: i.comercianteId,
      provider: i.provider,
      environment: i.environment,
      apelido: i.apelido,
      percentual: i.percentual,
      prioridade: i.prioridade,
      habilitado: i.habilitado,
      credenciaisMascaradas,
      atualizadoPor: i.atualizadoPor,
      criadoEm: i.criadoEm,
      atualizadoEm: i.atualizadoEm,
    };
  }
}
