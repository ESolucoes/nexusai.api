import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, IsIn, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class ListarMentoradosQueryDto {
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

  @ApiPropertyOptional({ description: 'Filtro por RG (contém, case-insensitive)' })
  @IsOptional()
  @IsString()
  rg?: string

  @ApiPropertyOptional({ description: 'Filtro por CPF (contém, case-insensitive)' })
  @IsOptional()
  @IsString()
  cpf?: string

  @ApiPropertyOptional({ description: 'Tipo do mentorado', enum: ['Executive', 'First Class'] })
  @IsOptional()
  @IsIn(['Executive', 'First Class'])
  tipo?: 'Executive' | 'First Class'

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
