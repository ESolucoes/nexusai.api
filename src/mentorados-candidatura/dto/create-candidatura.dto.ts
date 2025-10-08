import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class CreateCandidaturaDto {
  @IsOptional()
  @IsString()
  linkedin?: string;

  @IsOptional()
  @IsString()
  tipoVaga?: string;

  @IsOptional()
  @IsArray()
  empresasBloqueadas?: string[];

  @IsOptional()
  @IsNumber()
  pretensaoClt?: number;

  @IsOptional()
  @IsNumber()
  pretensaoPj?: number;

  @IsOptional()
  @IsNumber()
  maxAplicacoes?: number;

  @IsOptional()
  ativarIA?: boolean;
}
