import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, IsIn, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class ListarMentoresQueryDto {
  @ApiPropertyOptional({ description: 'Filtro por nome (contém, case-insensitive)' })
  @IsOptional()
  @IsString()
  nome?: string

  @ApiPropertyOptional({ description: 'Filtro por e-mail (contém, case-insensitive)' })
  @IsOptional()
  @IsString()
  email?: string

  @ApiPropertyOptional({ description: 'Filtro por telefone (contém, case-insensitive)' })
  @IsOptional()
  @IsString()
  telefone?: string

  @ApiPropertyOptional({ description: 'Tipo do mentor', enum: ['admin', 'normal'] })
  @IsOptional()
  @IsIn(['admin', 'normal'])
  tipo?: 'admin' | 'normal'

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20
}
