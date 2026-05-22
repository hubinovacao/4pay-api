import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventoWebhook } from './entities/evento-webhook.entity';
import { GatewayRouterService } from '../gateways/gateway-router.service';
import { PagamentosService } from '../pagamentos/pagamentos.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { GatewayTipo } from '../gateways/payment-gateway.interface';
import { GatewayProvider } from '../integrations/entities/integration.entity';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(EventoWebhook) private readonly repo: Repository<EventoWebhook>,
    private readonly router: GatewayRouterService,
    private readonly pagamentos: PagamentosService,
    private readonly integrations: IntegrationsService,
  ) {}

  /**
   * Recebe payload bruto de um gateway, encontra a `Integration` correta,
   * valida assinatura, persiste auditoria e aplica atualização no `Pagamento`.
   */
  async receber(
    provider: GatewayTipo,
    headers: Record<string, string>,
    rawBody: Buffer,
  ): Promise<{ ok: boolean }> {
    const evento = this.repo.create({
      provider: provider as GatewayProvider,
      assinaturaValida: false,
      processado: false,
      headers,
      body: rawBody.toString('utf8'),
    });

    // Estratégia: tentamos parsear/validar com cada integração ativa daquele provider
    // até encontrar uma cujo secret valide a assinatura. Multi-tenant resolve assim.
    const possiveis = await this.integrations.repoListByProvider(provider as GatewayProvider);
    const gateway = this.router.resolverGateway(provider);

    let parsed = null as ReturnType<typeof gateway.parseWebhook>;
    let integMatched = null as (typeof possiveis)[number] | null;
    for (const integ of possiveis) {
      const creds = this.integrations.readCredenciais(integ);
      const p = gateway.parseWebhook(headers, rawBody, creds);
      if (p) {
        parsed = p;
        integMatched = integ;
        break;
      }
    }

    if (!parsed || !integMatched) {
      evento.erro = 'Assinatura inválida ou payload não reconhecido';
      await this.repo.save(evento);
      this.logger.warn(`Webhook ${provider} rejeitado`);
      return { ok: false };
    }

    evento.assinaturaValida = true;
    evento.externalId = parsed.externalId;

    try {
      const credenciais = this.integrations.readCredenciais(integMatched);
      const intent =
        parsed.intent ?? (await gateway.getPayment(parsed.externalId, credenciais));

      const pagamento = await this.pagamentos.buscarPorExternalId(provider, parsed.externalId);
      if (pagamento) {
        await this.pagamentos.aplicarIntent(pagamento, intent);
      } else {
        this.logger.warn(
          `Webhook ${provider} para externalId=${parsed.externalId} sem pagamento local`,
        );
      }

      evento.processado = true;
      await this.repo.save(evento);
      return { ok: true };
    } catch (err: any) {
      evento.erro = String(err?.message ?? err);
      await this.repo.save(evento);
      this.logger.error(`Falha ao processar webhook ${provider}: ${evento.erro}`);
      return { ok: false };
    }
  }
}
