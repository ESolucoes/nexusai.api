import { ApiProperty } from '@nestjs/swagger'

export class MentorUsuarioResumoDto {
  @ApiProperty({ description: 'ID do registro na TABELA mentores (mentorId)' })
  id: string

  @ApiProperty({ description: 'ID do registro na TABELA usuarios (usuarioId)' })
  usuarioId: string

  @ApiProperty() nome: string
  @ApiProperty() email: string
  @ApiProperty({ nullable: true }) telefone: string | null
  @ApiProperty() criadoEm: Date
  @ApiProperty() atualizadoEm: Date
  @ApiProperty({ enum: ['admin', 'normal'] }) tipo: 'admin' | 'normal'

  @ApiProperty({ description: 'Quantidade de mentorados vinculados ao mentor' })
  mentorados: number
}

export class PaginatedMetaDto {
  @ApiProperty() total: number
  @ApiProperty() page: number
  @ApiProperty() limit: number
  @ApiProperty() totalPages: number
}

export class GetMentoresPaginadoResponseDto {
  @ApiProperty({ type: [MentorUsuarioResumoDto] })
  items: MentorUsuarioResumoDto[]

  @ApiProperty({ type: PaginatedMetaDto })
  meta: PaginatedMetaDto
}
