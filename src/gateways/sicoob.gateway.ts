import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  CreatePaymentInput,
  GatewayTipo,
  ParsedWebhookEvent,
  PaymentGateway,
  PaymentIntent,
  StatusPagamentoNormalizado,
} from './payment-gateway.interface';

/**
 * Integração Pix Sicoob — baseada em cerebro/4logos-gv/ref-sicoob-pix.md.
 *
 * Endpoints (PIX API v2):
 *   PUT  {baseUrl}/cob/{txid}   — criar cobrança imediata
 *   GET  {baseUrl}/cob/{txid}   — consultar status
 *
 * Headers:
 *   Authorization: Bearer SICOOB_BEARER_TOKEN
 *   client_id:     SICOOB_CLIENT_ID
 *
 * Credenciais esperadas no record:
 *   bearerToken, clientId, pixKey, baseUrl
 *
 * OBS: mTLS pode ser exigido em produção. Esta implementação cobre o caminho
 * happy path com Bearer; ajustar com `https.Agent({ cert, key })` ao subir prod.
 */
@Injectable()
export class SicoobGateway implements PaymentGateway {
  readonly tipo: GatewayTipo = 'sicoob';
  private readonly logger = new Logger(SicoobGateway.name);

  private buildHttp(credenciais: Record<string, string>): AxiosInstance {
    return axios.create({
      baseURL: credenciais.baseUrl,
      timeout: 15_000,
      headers: {
        Authorization: `Bearer ${credenciais.bearerToken}`,
        'Content-Type': 'application/json',
        client_id: credenciais.clientId,
      },
    });
  }

  async createPixPayment(
    input: CreatePaymentInput,
    credenciais: Record<string, string>,
  ): Promise<PaymentIntent> {
    this.assertCreds(credenciais);

    const txid = uuidv4().replace(/-/g, '').slice(0, 35);
    const expiracao = input.expiresInSeconds ?? 900;

    const payload = {
      calendario: { expiracao },
      valor: { original: (input.amountCents / 100).toFixed(2) },
      chave: credenciais.pixKey,
      solicitacaoPagador: input.description,
      infoAdicionais: [{ nome: 'internalReference', valor: input.internalReference }],
    };

    try {
      const http = this.buildHttp(credenciais);
      const { data } = await http.put(`/cob/${txid}`, payload);
      return this.toIntent(
        { ...data, txid },
        input.internalReference,
        input.amountCents,
        input.expiresInSeconds,
      );
    } catch (err: any) {
      this.logger.error(
        `Sicoob createPix falhou: ${err?.response?.status} ${JSON.stringify(err?.response?.data)}`,
      );
      throw new BadGatewayException('Falha ao criar Pix no Sicoob');
    }
  }

  async getPayment(
    externalId: string,
    credenciais: Record<string, string>,
  ): Promise<PaymentIntent> {
    this.assertCreds(credenciais);
    try {
      const http = this.buildHttp(credenciais);
      const { data } = await http.get(`/cob/${externalId}`);
      const valorCents = Math.round(Number(data?.valor?.original ?? 0) * 100);
      const ref =
        (data?.infoAdicionais ?? []).find((i: any) => i?.nome === 'internalReference')?.valor ?? '';
      return this.toIntent({ ...data, txid: externalId }, ref, valorCents);
    } catch (err: any) {
      this.logger.error(`Sicoob getPayment(${externalId}) falhou: ${err?.response?.status}`);
      throw new BadGatewayException('Falha ao consultar pagamento no Sicoob');
    }
  }

  /**
   * Sicoob não usa assinatura HMAC no webhook por padrão — a segurança é por URL/IP autorizado.
   * O payload traz array `pix` com itens contendo txid e status.
   */
  parseWebhook(
    _headers: Record<string, string>,
    rawBody: Buffer,
    _credenciais: Record<string, string>,
  ): ParsedWebhookEvent | null {
    let body: any;
    try {
      body = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return null;
    }
    const item = body?.pix?.[0];
    if (!item?.txid) return null;

    const status: StatusPagamentoNormalizado =
      item.status === 'CONCLUIDA' || item.endToEndId ? 'approved' : 'pending';

    return {
      externalId: item.txid,
      type: 'payment.updated',
      intent: {
        externalId: item.txid,
        internalReference: '',
        method: 'pix',
        amountCents: Math.round(Number(item.valor ?? 0) * 100),
        status,
        rawStatus: item.status,
      },
    };
  }

  private toIntent(
    data: any,
    internalReference: string,
    amountCentsFallback: number,
    expiresInSeconds?: number,
  ): PaymentIntent {
    const valorOriginal = data?.valor?.original ? Number(data.valor.original) * 100 : amountCentsFallback;
    const status = this.normalize(data?.status);
    const expiraEm =
      data?.calendario?.expiracao && data?.calendario?.criacao
        ? new Date(
            new Date(data.calendario.criacao).getTime() + data.calendario.expiracao * 1000,
          ).toISOString()
        : expiresInSeconds
        ? new Date(Date.now() + expiresInSeconds * 1000).toISOString()
        : undefined;

    return {
      externalId: data.txid,
      internalReference,
      method: 'pix',
      amountCents: Math.round(valorOriginal),
      status,
      pixCopyPaste: data?.pixCopiaECola,
      pixQrBase64: undefined,
      pixExpiresAt: expiraEm,
      rawStatus: data?.status,
    };
  }

  private normalize(s: string | undefined): StatusPagamentoNormalizado {
    switch (s) {
      case 'CONCLUIDA':
        return 'approved';
      case 'ATIVA':
        return 'pending';
      case 'REMOVIDA_PELO_PSP':
      case 'REMOVIDA_PELO_USUARIO_RECEBEDOR':
        return 'canceled';
      default:
        return 'pending';
    }
  }

  private assertCreds(c: Record<string, string>) {
    const faltam = ['bearerToken', 'clientId', 'pixKey', 'baseUrl'].filter((k) => !c[k]);
    if (faltam.length) {
      throw new BadGatewayException(`Sicoob: credenciais faltando: ${faltam.join(', ')}`);
    }
  }
}
