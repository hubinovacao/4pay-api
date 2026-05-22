import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { GatewayEnvironment, GatewayProvider } from '../entities/integration.entity';

export class CriarIntegrationDto {
  @IsUUID()
  comercianteId: string;

  @IsEnum(['mercadopago', 'sicoob'])
  provider: GatewayProvider;

  @IsEnum(['sandbox', 'production'])
  environment: GatewayEnvironment;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  apelido?: string;

  @IsObject()
  credenciais: Record<string, string>;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  percentual?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  prioridade?: number;

  @IsOptional()
  @IsBoolean()
  habilitado?: boolean;
}

export class AtualizarIntegrationDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  apelido?: string;

  @IsOptional()
  @IsObject()
  credenciais?: Record<string, string>;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  percentual?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  prioridade?: number;

  @IsOptional()
  @IsBoolean()
  habilitado?: boolean;
}
