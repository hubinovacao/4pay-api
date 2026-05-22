import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CriarComercianteDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  documento?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class AtualizarComercianteDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  documento?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
