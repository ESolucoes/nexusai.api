import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class PostUsuarioDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  nome: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiProperty({ description: 'Senha do usuário (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6)
  senha: string;
}
