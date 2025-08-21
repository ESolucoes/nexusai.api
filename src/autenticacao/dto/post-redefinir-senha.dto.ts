import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class PostRedefinirSenhaDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  codigo: string

  @ApiProperty({ example: 'NovaSenha@2025' })
  @IsString()
  @MinLength(6)
  novaSenha: string
}
