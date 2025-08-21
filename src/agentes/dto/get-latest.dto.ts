import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsString } from 'class-validator'

export class GetLatestQueryDto {
  @ApiProperty({ enum: ['PAUL_GPT','FAQ_NEXUS','TESTE_PERCEPCAO_VAGAS','MSG_HEADHUNTER','CALEIDOSCOPIO_CONTEUDO'] })
  @IsString()
  @IsIn(['PAUL_GPT','FAQ_NEXUS','TESTE_PERCEPCAO_VAGAS','MSG_HEADHUNTER','CALEIDOSCOPIO_CONTEUDO'])
  assistantKey!: string
}
