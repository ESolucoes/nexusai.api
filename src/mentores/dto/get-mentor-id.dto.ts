import { ApiProperty } from '@nestjs/swagger';

export class GetMentorIDDto {
  @ApiProperty() id: string;
  @ApiProperty() usuarioId: string;
  @ApiProperty({ enum: ['admin', 'normal'] }) tipo: 'admin' | 'normal';
  @ApiProperty() criadoEm: Date;
  @ApiProperty() atualizadoEm: Date;
}
