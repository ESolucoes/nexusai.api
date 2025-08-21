import { ApiProperty } from '@nestjs/swagger';

export class GetVigenciaDto {
  @ApiProperty() id: string;
  @ApiProperty() usuarioId: string;
  @ApiProperty() inicio: Date;
  @ApiProperty({ nullable: true }) fim: Date | null;
}
