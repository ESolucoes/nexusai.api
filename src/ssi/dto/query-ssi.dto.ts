import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator'
import { SsiMetrica } from '../enums/ssi-metrica.enum'

export class QuerySsiDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  usuarioId?: string

  @ApiPropertyOptional({ enum: SsiMetrica })
  @IsOptional()
  @IsEnum(SsiMetrica)
  metrica?: SsiMetrica

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dataInicio?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dataFim?: string

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  pagina?: number = 1

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantidade?: number = 20
}
