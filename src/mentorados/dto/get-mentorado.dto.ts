// src/mentorados/dto/get-mentorado.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class GetMentoradoDto {
  @ApiProperty() id: string;
  @ApiProperty() usuarioId: string;

  @ApiProperty({ nullable: true })
  mentorId: string | null;

  @ApiProperty({ enum: ['Executive', 'First Class'], nullable: true })
  tipo: 'Executive' | 'First Class' | null;
}
