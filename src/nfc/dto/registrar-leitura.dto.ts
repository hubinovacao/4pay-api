import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegistrarLeituraNfcDto {
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  uid: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  tecnologia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  payload?: string;
}
