import { ApiProperty } from '@nestjs/swagger';

export class GetMentorDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: ['admin', 'normal'] }) tipo: 'admin' | 'normal';
}
