import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @ApiProperty({ example: 'user@mail.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'minhaSenha123' })
  @IsString()
  @MinLength(6)
  senha: string
}
