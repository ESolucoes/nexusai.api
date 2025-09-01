// src/agentes/dto/create-agent-message.dto.ts
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger'

export class CreateAgentMessageDto {
  @ApiProperty() assistantKey: string
  @ApiPropertyOptional({ format: 'uuid' }) sessionId?: string
  @ApiPropertyOptional() content?: string
  @ApiPropertyOptional({ type: 'string', format: 'binary', isArray: true })
  files?: any // ou Express.Multer.File[]
}
