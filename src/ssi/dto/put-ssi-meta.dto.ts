import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber } from 'class-validator';
import { SsiMetrica } from '../enums/ssi-metrica.enum';
import { SsiUnidade } from '../enums/ssi-unidade.enum';

export class PutSsiMetaDto {
  @ApiProperty({ enum: SsiMetrica })
  @IsEnum(SsiMetrica)
  metrica: SsiMetrica;

  /** alvo/meta; para percentual use 0–100 (ex.: 5 = 5%) */
  @ApiProperty({ example: 65 })
  @IsNumber()
  valorMeta: number;

  @ApiProperty({ enum: SsiUnidade, example: SsiUnidade.NUMERO })
  @IsEnum(SsiUnidade)
  unidade: SsiUnidade;
}
