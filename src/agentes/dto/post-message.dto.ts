import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator'

export class PostMessageDto {
  @ApiProperty({ enum: ['PAUL_GPT','FAQ_NEXUS','TESTE_PERCEPCAO_VAGAS','MSG_HEADHUNTER','CALEIDOSCOPIO_CONTEUDO'] })
  @IsString()
  @IsIn(['PAUL_GPT','FAQ_NEXUS','TESTE_PERCEPCAO_VAGAS','MSG_HEADHUNTER','CALEIDOSCOPIO_CONTEUDO'])
  assistantKey!: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  sessionId?: string | null

  @ApiProperty({ minLength: 1 })
  @IsString()
  @MinLength(1)
  content!: string
}
