import { ApiProperty } from '@nestjs/swagger'

export class UploadAvatarResponseDto {
  @ApiProperty() sucesso: boolean
  @ApiProperty() url: string
  @ApiProperty() storageKey: string
  @ApiProperty() filename: string
  @ApiProperty() mime: string
  @ApiProperty() tamanho: number
}
