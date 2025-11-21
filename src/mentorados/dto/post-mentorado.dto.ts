import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PostMentoradoDto {
  @ApiProperty({ description: 'ID do usuário a ser vinculado' })
  @IsUUID()
  usuarioId: string;

  @ApiProperty({ description: 'ID do mentor responsável' })
  @IsUUID()
  mentorId: string;

  @ApiProperty({ enum: ['Executive', 'First Class'] })
  @IsIn(['Executive', 'First Class'])
  tipo: 'Executive' | 'First Class';

  @ApiProperty() @IsString() @Length(3, 20) rg: string;
  @ApiProperty() @IsString() @Length(11, 14) cpf: string;

  @ApiProperty() @IsString() @Length(2, 120) nomePai: string;
  @ApiProperty() @IsString() @Length(2, 120) nomeMae: string;

  @ApiProperty({ description: 'YYYY-MM-DD' })
  @IsDateString()
  dataNascimento: string;

  @ApiProperty() @IsString() @Length(2, 150) rua: string;
  @ApiProperty() @IsString() @Length(1, 20) numero: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(0, 120)
  complemento?: string;
  @ApiProperty() @IsString() @Length(8, 10) cep: string;

  @ApiProperty() @IsString() @Length(2, 120) cargoObjetivo: string;

  @ApiProperty() @Type(() => Number) @IsNumber() pretensaoClt: number;
  @ApiProperty() @Type(() => Number) @IsNumber() pretensaoPj: number;

  // CORREÇÃO: LinkedIn agora é opcional e não precisa ser URL válida
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  linkedin?: string;
}
