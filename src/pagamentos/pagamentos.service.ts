import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { GatewayRouterService } from '../gateways/gateway-router.service';
import { PaymentIntent } from '../gateways/payment-gateway.interface';
import { CriarPagamentoPixDto } from './dto/criar-pagamento.dto';
import { Pagamento, StatusPagamentoNormalizado } from './entities/pagamento.entity';

export interface CriarPagamentoContexto {
  comercianteId: string;
  maquininhaId?: string | null;
}

@Injectable()
export class PagamentosService {
  private readonly logger = new Logger(PagamentosService.name);

  constructor(
    @InjectRepository(Pagamento) private readonly repo: Repository<Pagamento>,
    private readonly router: GatewayRouterService,
    private readonly cfg: ConfigService,
  ) {}

  async criarPix(
    dto: CriarPagamentoPixDto,
    contexto: CriarPagamentoContexto,
  ): Promise<Pagamento> {
    const { gateway, integration, credenciais } = await this.router.selecionar(
      contexto.comercianteId,
      dto.forcarGateway,
    );

    const internalReference = `4pay_${Date.now()}_${uuidv4().slice(0, 8)}`;
    const baseUrl = this.cfg.get<string>('PUBLIC_BASE_URL');
    const notificationUrl = baseUrl
      ? `${baseUrl.replace(/\/$/, '')}/webhooks/${integration.provider}`
      : undefined;

    const valorTotal = this.valorTotal(dto);

    const intent: PaymentIntent = await gateway.createPixPayment(
      {
        internalReference,
        amountCents: valorTotal,
        description: dto.descricao,
        payer: dto.pagador,
        expiresInSeconds: dto.expiracaoSegundos,
        notificationUrl,
      },
      credenciais,
    );

    const pagamento = this.repo.create({
      internalReference,
      externalId: intent.externalId,
      gatewayProvider: integration.provider,
      gatewayEnvironment: integration.environment,
      comercianteId: contexto.comercianteId,
      maquininhaId: contexto.maquininhaId ?? null,
      integrationId: integration.id,
      status: intent.status,
      statusDetail: intent.statusDetail ?? null,
      rawStatus: intent.rawStatus ?? null,
      valorCentavos: valorTotal,
      descricao: dto.descricao,
      metodo: 'pix',
      pixCopyPaste: intent.pixCopyPaste ?? null,
      pixQrBase64: intent.pixQrBase64 ?? null,
      expiraEm: intent.pixExpiresAt ? new Date(intent.pixExpiresAt) : null,
      itens: dto.itens ?? null,
      pagador: dto.pagador ?? null,
    });

    return this.repo.save(pagamento);
  }

  async buscarPorId(id: string): Promise<Pagamento> {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Pagamento não encontrado');
    return p;
  }

  async buscarPorExternalId(
    provider: string,
    externalId: string,
  ): Promise<Pagamento | null> {
    return this.repo.findOne({ where: { gatewayProvider: provider as any, externalId } });
  }

  /** Polling do app: consulta provider e atualiza status local. */
  async sincronizar(id: string): Promise<Pagamento> {
    const p = await this.buscarPorId(id);
    if (!p.externalId) return p;
    const { gateway, credenciais } = await this.router.resolverPorIntegrationId(p.integrationId);
    const intent = await gateway.getPayment(p.externalId, credenciais);
    return this.aplicarIntent(p, intent);
  }

  async aplicarIntent(p: Pagamento, intent: PaymentIntent): Promise<Pagamento> {
    const novoStatus = intent.status as StatusPagamentoNormalizado;
    const mudou = p.status !== novoStatus;

    p.status = novoStatus;
    p.statusDetail = intent.statusDetail ?? p.statusDetail;
    p.rawStatus = intent.rawStatus ?? p.rawStatus;
    if (novoStatus === 'approved' && !p.pagoEm) {
      p.pagoEm = new Date();
    }

    const salvo = await this.repo.save(p);
    if (mudou) {
      this.logger.log(
        `Pagamento ${salvo.id} mudou para ${novoStatus} (gateway=${p.gatewayProvider} external=${p.externalId})`,
      );
    }
    return salvo;
  }

  async listarPorComerciante(
    comercianteId: string,
    opts: { limit?: number; offset?: number; status?: StatusPagamentoNormalizado } = {},
  ): Promise<{ items: Pagamento[]; total: number }> {
    const limit = Math.min(opts.limit ?? 50, 200);
    const offset = opts.offset ?? 0;
    const where: any = { comercianteId };
    if (opts.status) where.status = opts.status;
    const [items, total] = await this.repo.findAndCount({
      where,
      order: { criadoEm: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { items, total };
  }

  private valorTotal(dto: CriarPagamentoPixDto): number {
    if (dto.itens?.length) {
      return dto.itens.reduce((acc, i) => acc + i.quantidade * i.valorUnitarioCentavos, 0);
    }
    return dto.valorCentavos;
  }
}
