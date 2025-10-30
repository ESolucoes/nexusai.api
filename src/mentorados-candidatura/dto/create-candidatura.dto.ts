// src/mentorados-candidatura/dto/create-candidatura.dto.ts
import { IsOptional, IsString, IsNumber, IsArray, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCandidaturaDto {
  @ApiProperty({ description: 'Tipo de vaga desejada', example: 'Desenvolvedor Full Stack' })
  @IsOptional()
  @IsString()
  tipoVaga?: string;

  @ApiProperty({ description: 'Empresas a serem evitadas', example: ['Consultoria X', 'Empresa Y'], required: false })
  @IsOptional()
  @IsArray()
  empresasBloqueadas?: string[];

  @ApiProperty({ description: 'Pretensão salarial CLT', example: 6000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  pretensaoClt?: number;

  @ApiProperty({ description: 'Pretensão salarial PJ', example: 8000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  pretensaoPj?: number;

  @ApiProperty({ description: 'Máximo de aplicações por execução', example: 10, default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  maxAplicacoes?: number = 5;

  @ApiProperty({ description: 'Ativar modo inteligente de candidatura', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  ativarIA?: boolean = true;

  @ApiProperty({ description: 'ID do mentorado', required: true })
  @IsString()
  mentoradoId: string;
}