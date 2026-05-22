import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

/**
 * AES-256-GCM com chave mestra única (`INTEGRATIONS_MASTER_KEY`).
 * Formato persistido: base64( iv(12) | tag(16) | ciphertext )
 */
@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(cfg: ConfigService) {
    const raw = cfg.get<string>('INTEGRATIONS_MASTER_KEY');
    if (!raw) throw new InternalServerErrorException('INTEGRATIONS_MASTER_KEY não definido');
    // Aceita chave em qualquer comprimento e deriva 32 bytes via SHA-256.
    this.key = createHash('sha256').update(raw).digest();
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString('base64');
  }

  decrypt(payload: string): string {
    const buf = Buffer.from(payload, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return dec.toString('utf8');
  }

  /** Mascarar token sensível para exibição (`••••…últimos 8`). */
  mask(value: string | null | undefined): string | null {
    if (!value) return null;
    if (value.length <= 8) return '••••';
    return `••••…${value.slice(-8)}`;
  }
}
