import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsArray, IsDateString, IsNumber, IsOptional, IsUUID, ValidateNested, IsEnum } from 'class-validator'
import { SsiMetrica } from '../enums/ssi-metrica.enum'

class PutSsiItemDto {
  @ApiProperty({ enum: SsiMetrica })
  @IsEnum(SsiMetrica)
  metrica: SsiMetrica

  /** para percentual, enviar 0â€“100 (ex.: 1 = 1%) */
  @ApiProperty()
  @IsNumber()
  valor: number
}

export class PutSsiBatchDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  usuarioId?: string

  @ApiProperty({ example: '2025-09-01' })
  @IsDateString()
  dataReferencia: string

  @ApiProperty({ type: [PutSsiItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PutSsiItemDto)
  itens: PutSsiItemDto[]
}
