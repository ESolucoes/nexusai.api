import { ApiProperty } from '@nestjs/swagger'

export class UploadCurriculoResponseDto {
  @ApiProperty() sucesso: boolean
  @ApiProperty() storageKey: string
  @ApiProperty() filename: string
  @ApiProperty() mime: string
  @ApiProperty() tamanho: number
  @ApiProperty({ nullable: true }) url?: string | null
}
