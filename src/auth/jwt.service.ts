import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { JwtUser } from './auth.types';

/**
 * JWT HS256 minimal sem dependência externa.
 * Token: base64url(header).base64url(payload).base64url(signature)
 */
@Injectable()
export class JwtService {
  private readonly secret: string;
  private readonly ttlSeconds: number;

  constructor(cfg: ConfigService) {
    const s = cfg.get<string>('JWT_SECRET');
    if (!s) throw new InternalServerErrorException('JWT_SECRET não definido');
    this.secret = s;
    this.ttlSeconds = Number(cfg.get<string>('JWT_TTL_SECONDS', '28800'));
  }

  sign(user: JwtUser, ttlSeconds?: number): string {
    const exp = Math.floor(Date.now() / 1000) + (ttlSeconds ?? this.ttlSeconds);
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { ...user, exp, iat: Math.floor(Date.now() / 1000) };

    const h = this.b64url(JSON.stringify(header));
    const p = this.b64url(JSON.stringify(payload));
    const sig = this.b64url(this.hmac(`${h}.${p}`));
    return `${h}.${p}.${sig}`;
  }

  verify(token: string): JwtUser {
    const parts = token.split('.');
    if (parts.length !== 3) throw new UnauthorizedException('Token inválido');
    const [h, p, s] = parts;

    const expected = this.b64url(this.hmac(`${h}.${p}`));
    const a = Buffer.from(expected);
    const b = Buffer.from(s);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Assinatura inválida');
    }

    const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8')) as JwtUser & {
      exp: number;
    };
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token expirado');
    }
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      comercianteId: payload.comercianteId,
    };
  }

  private hmac(input: string): Buffer {
    return createHmac('sha256', this.secret).update(input).digest();
  }

  private b64url(input: string | Buffer): string {
    return Buffer.from(input).toString('base64url');
  }
}
