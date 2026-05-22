import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CriarMaquininhaDto {
  @IsUUID()
  comercianteId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome: string;

  @IsString()
  @MinLength(3)
  @MaxLength(80)
  serial: string;

  @IsOptional()
  @IsBoolean()
  ativa?: boolean;
}

export class AtualizarMaquininhaDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nome?: string;

  @IsOptional()
  @IsBoolean()
  ativa?: boolean;
}
