import { ApiProperty } from '@nestjs/swagger'

export class PostMentoradoCurriculoDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any
}
