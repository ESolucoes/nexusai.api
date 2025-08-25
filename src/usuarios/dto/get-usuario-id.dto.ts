import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

class VigenciaResumoDto {
  @ApiProperty() id: string
  @ApiProperty() inicio: Date
  @ApiProperty({ nullable: true }) fim: Date | null
}

class MentorResumoDto {
  @ApiProperty({ enum: ['admin', 'normal'] }) tipo: 'admin' | 'normal'
}

class MentoradoMentorUsuarioResumoDto {
  @ApiProperty() nome: string
  @ApiProperty() email: string
  @ApiPropertyOptional({ nullable: true }) telefone?: string | null
}

class MentoradoMentorResumoDto {
  @ApiProperty({ enum: ['admin', 'normal'] }) tipo: 'admin' | 'normal'
  @ApiProperty({ type: MentoradoMentorUsuarioResumoDto }) usuario: MentoradoMentorUsuarioResumoDto
}

class MentoradoCurriculoDto {
  @ApiProperty() storageKey: string
  @ApiProperty() filename: string
  @ApiProperty() mime: string
  @ApiProperty() tamanho: number
  @ApiPropertyOptional({ nullable: true }) url?: string | null
}

class MentoradoCompletoDto {
  @ApiProperty() id: string
  @ApiProperty({ enum: ['Executive', 'First Class'] }) tipo: 'Executive' | 'First Class'
  @ApiProperty() rg: string
  @ApiProperty() cpf: string
  @ApiProperty() nomePai: string
  @ApiProperty() nomeMae: string
  @ApiProperty({ description: 'YYYY-MM-DD' }) dataNascimento: string
  @ApiProperty() rua: string
  @ApiProperty() numero: string
  @ApiProperty({ nullable: true }) complemento: string | null
  @ApiProperty() cep: string
  @ApiProperty() cargoObjetivo: string
  @ApiProperty() pretensaoClt: string
  @ApiProperty() pretensaoPj: string
  @ApiProperty() linkedin: string
  @ApiPropertyOptional({ type: MentoradoCurriculoDto, nullable: true }) curriculo?: MentoradoCurriculoDto | null
  @ApiProperty() criadoEm: Date
  @ApiProperty() atualizadoEm: Date
  @ApiPropertyOptional({ type: MentoradoMentorResumoDto, nullable: true }) mentor?: MentoradoMentorResumoDto | null
}

export class GetUsuarioIDDto {
  @ApiProperty() id: string
  @ApiProperty() nome: string
  @ApiProperty() email: string
  @ApiPropertyOptional({ nullable: true }) telefone?: string | null
  @ApiProperty() criadoEm: Date
  @ApiProperty() atualizadoEm: Date
  @ApiPropertyOptional({ description: 'URL pública do avatar do usuário', nullable: true })
  avatarUrl?: string | null
  @ApiPropertyOptional({ type: VigenciaResumoDto, nullable: true })
  vigenciaAtiva?: VigenciaResumoDto | null
  @ApiPropertyOptional({ type: MentorResumoDto, nullable: true })
  mentor?: MentorResumoDto | null
  @ApiPropertyOptional({ type: MentoradoCompletoDto, nullable: true })
  mentorado?: MentoradoCompletoDto | null
}
