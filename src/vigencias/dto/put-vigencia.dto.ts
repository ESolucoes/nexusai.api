import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class PutVigenciaDto {
  @ApiPropertyOptional({ description: 'Novo início (>= agora)' })
  @IsOptional()
  @IsDateString()
  inicio?: string;

  @ApiPropertyOptional({ description: 'Novo fim (> início ou null)', nullable: true })
  @IsOptional()
  @IsDateString()
  fim?: string | null;
}
