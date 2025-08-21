import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class PutMentorDto {
  @ApiProperty({ enum: ['admin', 'normal'] })
  @IsIn(['admin', 'normal'])
  tipo: 'admin' | 'normal';
}
