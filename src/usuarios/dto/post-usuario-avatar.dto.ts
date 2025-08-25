import { ApiProperty } from '@nestjs/swagger'

export class PostUsuarioAvatarDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any
}
