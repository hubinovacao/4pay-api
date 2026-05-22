import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  descricao: string;

  @IsInt()
  @Min(1)
  @Max(9999)
  quantidade: number;

  @IsInt()
  @Min(1)
  valorUnitarioCentavos: number;
}

export class PagadorDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sobrenome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  documento?: string;
}

export class CriarPagamentoPixDto {
  @IsInt()
  @Min(1)
  valorCentavos: number;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  descricao: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  itens?: ItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PagadorDto)
  pagador?: PagadorDto;

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(86400)
  expiracaoSegundos?: number;

  /** Força um gateway específico (opcional). Caso omitido, o router decide. */
  @IsOptional()
  @IsEnum(['mercadopago', 'sicoob'])
  forcarGateway?: 'mercadopago' | 'sicoob';
}
