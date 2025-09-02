import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { SsiMetrica } from '../enums/ssi-metrica.enum'

class SsiItemDto {
  @ApiProperty({ enum: SsiMetrica })
  @IsEnum(SsiMetrica)
  metrica: SsiMetrica

  /** para percentual, envie 0â€“100 (ex.: 1 significa 1%) */
  @ApiProperty()
  @IsNumber()
  valor: number
}

export class PostSsiBatchDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  usuarioId?: string

  @ApiProperty({ example: '2025-09-01' })
  @IsDateString()
  dataReferencia: string

  @ApiProperty({ type: [SsiItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SsiItemDto)
  itens: SsiItemDto[]
}
