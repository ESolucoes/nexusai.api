// src/mentorado-ssi/dto/query-mss.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { MssIndicador } from '../enums/mss-indicador.enum';

export class QueryMssDto {
  @ApiPropertyOptional({ enum: MssIndicador })
  @IsOptional()
  @IsEnum(MssIndicador)
  indicador?: MssIndicador;
}
