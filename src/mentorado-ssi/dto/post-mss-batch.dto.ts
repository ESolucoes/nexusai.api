// src/mentorado-ssi/dto/post-mss-batch.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, ArrayMinSize, ArrayMaxSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MssIndicador } from '../enums/mss-indicador.enum';

class MssItemDto {
  @ApiProperty({ enum: MssIndicador })
  @IsEnum(MssIndicador)
  indicador: MssIndicador;

  @ApiProperty({ type: [Number], description: '12 valores semanais na ordem Semana 01..Semana 12' })
  @IsArray()
  @ArrayMinSize(12)
  @ArrayMaxSize(12)
  @IsNumber({}, { each: true })
  semanas: number[];
}

export class PostMssBatchDto {
  @ApiProperty({ type: [MssItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MssItemDto)
  itens: MssItemDto[];
}
