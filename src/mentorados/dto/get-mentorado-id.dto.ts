// src/mentorados/dto/get-mentorado-id.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class GetMentoradoIDDto {
  @ApiProperty() id: string;
  @ApiProperty() usuarioId: string;

  @ApiProperty({ nullable: true })
  mentorId: string | null;

  @ApiProperty({ enum: ['Executive', 'First Class'], nullable: true })
  tipo: 'Executive' | 'First Class' | null;

  @ApiProperty() rg: string;
  @ApiProperty() cpf: string;
  @ApiProperty() nomePai: string;
  @ApiProperty() nomeMae: string;
  @ApiProperty() dataNascimento: string;

  @ApiProperty() rua: string;
  @ApiProperty() numero: string;
  @ApiProperty({ nullable: true }) complemento: string | null;
  @ApiProperty() cep: string;

  @ApiProperty() cargoObjetivo: string;
  @ApiProperty() pretensaoClt: string;
  @ApiProperty() pretensaoPj: string;
  @ApiProperty() linkedin: string;

  @ApiProperty() criadoEm: Date;
  @ApiProperty() atualizadoEm: Date;
}
