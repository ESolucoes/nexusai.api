import { ApiProperty } from '@nestjs/swagger';

export class GetMentoradoIDDto {
  @ApiProperty() id: string;
  @ApiProperty() usuarioId: string;
  @ApiProperty() mentorId: string;
  @ApiProperty({ enum: ['Executive', 'First Class'] }) tipo: 'Executive' | 'First Class';

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
