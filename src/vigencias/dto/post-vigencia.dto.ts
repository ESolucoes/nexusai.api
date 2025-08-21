import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsOptional } from 'class-validator';

export class PostVigenciaDto {
  @ApiProperty({ description: 'E-mail do usuário dono da vigência' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Data/hora de início (>= agora)' })
  @IsDateString()
  inicio: string;

  @ApiProperty({
    description: 'Data/hora de término (opcional, deve ser > início)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  fim?: string;
}
