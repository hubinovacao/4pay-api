import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { IntegrationsService } from '../integrations/integrations.service';
import { Integration } from '../integrations/entities/integration.entity';
import { MercadoPagoGateway } from './mercadopago.gateway';
import { SicoobGateway } from './sicoob.gateway';
import { GatewayTipo, PaymentGateway } from './payment-gateway.interface';

export interface GatewaySelecionado {
  gateway: PaymentGateway;
  integration: Integration;
  credenciais: Record<string, string>;
}

/**
 * Decide qual gateway atende a próxima transação de um comerciante.
 * Usa amostragem ponderada pelo `percentual` configurado em `integrations`.
 *
 * Se nenhuma integração tem percentual > 0, cai no `prioridade` (maior primeiro).
 */
@Injectable()
export class GatewayRouterService {
  private readonly logger = new Logger(GatewayRouterService.name);

  constructor(
    private readonly integrations: IntegrationsService,
    private readonly mp: MercadoPagoGateway,
    private readonly sicoob: SicoobGateway,
  ) {}

  async selecionar(comercianteId: string, forcarTipo?: GatewayTipo): Promise<GatewaySelecionado> {
    const ativos = await this.integrations.listAtivos(comercianteId);
    if (!ativos.length) {
      throw new BadRequestException('Comerciante sem gateway habilitado');
    }

    const candidatos = forcarTipo ? ativos.filter((i) => i.provider === forcarTipo) : ativos;
    if (!candidatos.length) {
      throw new BadRequestException(`Nenhum gateway ${forcarTipo} habilitado para o comerciante`);
    }

    const escolhido = this.escolherPorPeso(candidatos);
    const gateway = this.resolverGateway(escolhido.provider);
    const credenciais = this.integrations.readCredenciais(escolhido);

    this.logger.log(
      `Gateway selecionado: ${escolhido.provider} (${escolhido.environment}) para comerciante=${comercianteId}`,
    );
    return { gateway, integration: escolhido, credenciais };
  }

  async resolverPorIntegrationId(integrationId: string): Promise<GatewaySelecionado> {
    const integ = await this.integrations.findById(integrationId);
    return {
      gateway: this.resolverGateway(integ.provider),
      integration: integ,
      credenciais: this.integrations.readCredenciais(integ),
    };
  }

  resolverGateway(tipo: GatewayTipo): PaymentGateway {
    switch (tipo) {
      case 'mercadopago':
        return this.mp;
      case 'sicoob':
        return this.sicoob;
      default:
        throw new BadRequestException(`Gateway não suportado: ${tipo}`);
    }
  }

  private escolherPorPeso(ativos: Integration[]): Integration {
    const somaPercentual = ativos.reduce((acc, i) => acc + i.percentual, 0);

    if (somaPercentual <= 0) {
      // Fallback: maior prioridade, depois mais antigo.
      return [...ativos].sort(
        (a, b) =>
          b.prioridade - a.prioridade || a.criadoEm.getTime() - b.criadoEm.getTime(),
      )[0];
    }

    const draw = Math.random() * somaPercentual;
    let acc = 0;
    for (const i of ativos) {
      acc += i.percentual;
      if (draw <= acc) return i;
    }
    return ativos[ativos.length - 1];
  }
}
