import { ApiProperty } from '@nestjs/swagger';

export class GetMentoradoDto {
  @ApiProperty() id: string;
  @ApiProperty() usuarioId: string;
  @ApiProperty() mentorId: string;
  @ApiProperty({ enum: ['Executive', 'First Class'] }) tipo: 'Executive' | 'First Class';
}
