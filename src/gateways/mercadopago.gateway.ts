import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  CreatePaymentInput,
  GatewayTipo,
  ParsedWebhookEvent,
  PaymentGateway,
  PaymentIntent,
  StatusPagamentoNormalizado,
} from './payment-gateway.interface';

interface MpPaymentResponse {
  id: number;
  status: string;
  status_detail: string;
  date_of_expiration?: string;
  transaction_amount: number;
  external_reference?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
}

@Injectable()
export class MercadoPagoGateway implements PaymentGateway {
  readonly tipo: GatewayTipo = 'mercadopago';
  private readonly logger = new Logger(MercadoPagoGateway.name);

  private buildHttp(accessToken: string): AxiosInstance {
    return axios.create({
      baseURL: 'https://api.mercadopago.com',
      timeout: 15_000,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createPixPayment(
    input: CreatePaymentInput,
    credenciais: Record<string, string>,
  ): Promise<PaymentIntent> {
    const accessToken = credenciais.accessToken;
    if (!accessToken) throw new BadGatewayException('MP: accessToken não configurado');

    const expiracao = input.expiresInSeconds ?? 900;
    const dateOfExpiration = new Date(Date.now() + expiracao * 1000).toISOString();

    const body = {
      transaction_amount: Number((input.amountCents / 100).toFixed(2)),
      description: input.description,
      payment_method_id: 'pix',
      external_reference: input.internalReference,
      date_of_expiration: dateOfExpiration,
      notification_url: input.notificationUrl,
      payer: {
        email: input.payer?.email ?? 'comprador@4pay.local',
        first_name: input.payer?.nome ?? 'Cliente',
        last_name: input.payer?.sobrenome ?? '4pay',
      },
    };

    try {
      const http = this.buildHttp(accessToken);
      const { data } = await http.post<MpPaymentResponse>('/v1/payments', body, {
        headers: { 'X-Idempotency-Key': uuidv4() },
      });
      return this.toIntent(data, input.internalReference);
    } catch (err: any) {
      this.logger.error(
        `MP createPix falhou: ${err?.response?.status} ${JSON.stringify(err?.response?.data)}`,
      );
      throw new BadGatewayException('Falha ao criar Pix no Mercado Pago');
    }
  }

  async getPayment(
    externalId: string,
    credenciais: Record<string, string>,
  ): Promise<PaymentIntent> {
    const accessToken = credenciais.accessToken;
    if (!accessToken) throw new BadGatewayException('MP: accessToken não configurado');
    const http = this.buildHttp(accessToken);
    try {
      const { data } = await http.get<MpPaymentResponse>(`/v1/payments/${externalId}`);
      return this.toIntent(data, data.external_reference ?? '');
    } catch (err: any) {
      this.logger.error(`MP getPayment(${externalId}) falhou: ${err?.response?.status}`);
      throw new BadGatewayException('Falha ao consultar pagamento no Mercado Pago');
    }
  }

  /**
   * Valida assinatura HMAC-SHA256 (x-signature) conforme docs MP e devolve o evento.
   * Algoritmo: HMAC com fórmula `id:DATA_ID;request-id:REQUEST_ID;ts:TS;`
   */
  parseWebhook(
    headers: Record<string, string>,
    rawBody: Buffer,
    credenciais: Record<string, string>,
  ): ParsedWebhookEvent | null {
    const secret = credenciais.webhookSecret;
    if (!secret) {
      this.logger.warn('MP webhook recebido sem webhookSecret configurado — rejeitado');
      return null;
    }

    const signatureHeader = headers['x-signature'] ?? headers['X-Signature'];
    const requestId = headers['x-request-id'] ?? headers['X-Request-Id'];
    if (!signatureHeader || !requestId) return null;

    const parts = Object.fromEntries(
      signatureHeader.split(',').map((p) => {
        const [k, v] = p.split('=');
        return [k.trim(), v?.trim()];
      }),
    );
    const ts = parts['ts'];
    const v1 = parts['v1'];
    if (!ts || !v1) return null;

    let body: any;
    try {
      body = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return null;
    }

    const dataId = String(body?.data?.id ?? '');
    if (!dataId) return null;

    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const expected = createHmac('sha256', secret).update(manifest).digest('hex');

    const expBuf = Buffer.from(expected, 'hex');
    const recvBuf = Buffer.from(v1, 'hex');
    if (expBuf.length !== recvBuf.length || !timingSafeEqual(expBuf, recvBuf)) {
      this.logger.warn('MP webhook com assinatura inválida — rejeitado');
      return null;
    }

    return { externalId: dataId, type: 'payment.updated' };
  }

  private toIntent(mp: MpPaymentResponse, internalReference: string): PaymentIntent {
    return {
      externalId: String(mp.id),
      internalReference,
      method: 'pix',
      amountCents: Math.round(mp.transaction_amount * 100),
      status: this.normalize(mp.status),
      statusDetail: mp.status_detail,
      pixCopyPaste: mp.point_of_interaction?.transaction_data?.qr_code,
      pixQrBase64: mp.point_of_interaction?.transaction_data?.qr_code_base64,
      pixExpiresAt: mp.date_of_expiration,
      rawStatus: mp.status,
    };
  }

  private normalize(s: string): StatusPagamentoNormalizado {
    switch (s) {
      case 'approved':
      case 'authorized':
        return 'approved';
      case 'pending':
      case 'in_process':
      case 'in_mediation':
        return 'pending';
      case 'rejected':
        return 'refused';
      case 'cancelled':
        return 'canceled';
      case 'refunded':
      case 'charged_back':
        return 'refunded';
      default:
        return 'pending';
    }
  }
}
