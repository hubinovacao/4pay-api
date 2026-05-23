import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CriarComercianteDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  documento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  razaoSocial?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  nomeFantasia: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  inscricaoEstadual?: string;

  @IsOptional()
  @IsString()
  @Length(8, 8)
  cep?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  logradouro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  numero?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  complemento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  bairro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  municipio?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  uf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class AtualizarComercianteDto {
  @IsOptional() @IsString() @MaxLength(32) documento?: string;
  @IsOptional() @IsString() @MaxLength(180) razaoSocial?: string;
  @IsOptional() @IsString() @MaxLength(180) nomeFantasia?: string;
  @IsOptional() @IsString() @MaxLength(60) inscricaoEstadual?: string;
  @IsOptional() @IsString() @Length(8, 8) cep?: string;
  @IsOptional() @IsString() @MaxLength(180) logradouro?: string;
  @IsOptional() @IsString() @MaxLength(30) numero?: string;
  @IsOptional() @IsString() @MaxLength(120) complemento?: string;
  @IsOptional() @IsString() @MaxLength(120) bairro?: string;
  @IsOptional() @IsString() @MaxLength(120) municipio?: string;
  @IsOptional() @IsString() @Length(2, 2) uf?: string;
  @IsOptional() @IsString() @MaxLength(20) telefone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
}
