import { ApiProperty } from '@nestjs/swagger'
import { IsEmail } from 'class-validator'

export class PostSolicitarCodigoDto {
  @ApiProperty({ example: 'user@mail.com' })
  @IsEmail()
  email: string
}
