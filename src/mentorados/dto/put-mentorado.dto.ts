import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  Length,
  IsDateString,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PutMentoradoDto {
  @ApiPropertyOptional({ description: 'Novo mentor responsável' })
  @IsOptional()
  @IsUUID()
  mentorId?: string;

  @ApiPropertyOptional({ enum: ['Executive', 'First Class'] })
  @IsOptional()
  @IsIn(['Executive', 'First Class'])
  tipo?: 'Executive' | 'First Class';

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(3, 20) rg?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(11, 14) cpf?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 120)
  nomePai?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 120)
  nomeMae?: string;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  dataNascimento?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(2, 150) rua?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 20)
  numero?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 120)
  complemento?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(8, 10) cep?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 120)
  cargoObjetivo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pretensaoClt?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pretensaoPj?: number;

  // CORREÇÃO: LinkedIn agora é opcional
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 255)
  linkedin?: string;
}
