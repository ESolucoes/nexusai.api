import { ApiProperty } from '@nestjs/swagger'
import { IsDateString, IsEnum, IsNumber, IsOptional, IsUUID } from 'class-validator'
import { SsiMetrica } from '../enums/ssi-metrica.enum'

export class PutSsiDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  usuarioId?: string

  @ApiProperty({ enum: SsiMetrica })
  @IsEnum(SsiMetrica)
  metrica: SsiMetrica

  /** ISO date (ex.: '2025-09-01') */
  @ApiProperty({ example: '2025-09-01' })
  @IsDateString()
  dataReferencia: string

  /** para percentual, enviar 0â€“100 (ex.: 1 = 1%) */
  @ApiProperty()
  @IsNumber()
  valor: number
}
