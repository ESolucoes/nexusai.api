import { ApiProperty } from '@nestjs/swagger';

export class MentoradoUsuarioResumoDto {
  @ApiProperty() id: string;
  @ApiProperty() nome: string;
  @ApiProperty() email: string;
  @ApiProperty({ nullable: true }) telefone: string | null;
  @ApiProperty() criadoEm: Date;
  @ApiProperty() atualizadoEm: Date;
  @ApiProperty({ enum: ['Executive', 'First Class'] }) tipo: 'Executive' | 'First Class';
  @ApiProperty() rg: string;
  @ApiProperty() cpf: string;
  @ApiProperty({ nullable: true }) avatarUrl?: string | null;
}

export class PaginatedMetaDto {
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}

export class GetMentoradosPaginadoResponseDto {
  @ApiProperty({ type: [MentoradoUsuarioResumoDto] })
  items: MentoradoUsuarioResumoDto[];

  @ApiProperty({ type: PaginatedMetaDto })
  meta: PaginatedMetaDto;
}
