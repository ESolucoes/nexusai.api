import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsIn } from 'class-validator';

export class PostMentorDto {
  @ApiProperty({ description: 'ID do usuário a ser vinculado' })
  @IsUUID()
  usuarioId: string;

  @ApiProperty({ enum: ['admin', 'normal'] })
  @IsIn(['admin', 'normal'])
  tipo: 'admin' | 'normal';
}
