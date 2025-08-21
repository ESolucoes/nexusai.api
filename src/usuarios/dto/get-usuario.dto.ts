import { ApiProperty } from '@nestjs/swagger';

export class GetUsuarioDto {
  @ApiProperty() id: string;
  @ApiProperty() nome: string;
  @ApiProperty() email: string;
  @ApiProperty({ required: false, nullable: true }) telefone?: string | null;
  @ApiProperty() criadoEm: Date;
  @ApiProperty() atualizadoEm: Date;
}
