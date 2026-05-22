export type StatusPagamentoNormalizado =
  | 'pending'
  | 'approved'
  | 'refused'
  | 'canceled'
  | 'refunded'
  | 'expired';

export type GatewayTipo = 'mercadopago' | 'sicoob';

/** Estado normalizado de um pagamento, agnóstico do gateway. */
export interface PaymentIntent {
  /** ID do pagamento no provedor (ex.: MP payment id, Sicoob txid). */
  externalId: string;
  /** Nossa referência (UUID do pagamento local). */
  internalReference: string;
  method: 'pix';
  amountCents: number;
  status: StatusPagamentoNormalizado;
  statusDetail?: string;
  pixCopyPaste?: string;
  pixQrBase64?: string;
  pixExpiresAt?: string;
  /** Status bruto retornado pelo provedor, para auditoria. */
  rawStatus?: string;
}

export interface CreatePaymentInput {
  internalReference: string;
  amountCents: number;
  description: string;
  payer?: { email?: string; nome?: string; sobrenome?: string; documento?: string };
  expiresInSeconds?: number;
  notificationUrl?: string;
}

export interface ParsedWebhookEvent {
  /** ID do pagamento no provedor referenciado pelo evento. */
  externalId: string;
  /** Tipo do evento normalizado. */
  type: 'payment.updated';
  /** Estado atual já normalizado, se o webhook trouxer payload completo. Caso contrário, fetch via getPayment. */
  intent?: PaymentIntent;
}

/**
 * Contrato comum a todos os gateways (MP, Sicoob, ...).
 * A camada de pagamentos consome esta interface — nunca a implementação concreta.
 */
export interface PaymentGateway {
  readonly tipo: GatewayTipo;

  createPixPayment(input: CreatePaymentInput, credenciais: Record<string, string>): Promise<PaymentIntent>;
  getPayment(externalId: string, credenciais: Record<string, string>): Promise<PaymentIntent>;
  parseWebhook(
    headers: Record<string, string>,
    rawBody: Buffer,
    credenciais: Record<string, string>,
  ): ParsedWebhookEvent | null;
}
