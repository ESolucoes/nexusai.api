import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { AgentesService } from './agentes.service'
import { GetLatestQueryDto } from './dto/get-latest.dto'
import { PostMessageDto } from './dto/post-message.dto'

@ApiTags('Agentes')
@ApiBearerAuth()
@Controller('agentes')
export class AgentesController {
  constructor(private readonly svc: AgentesService) {}

  @Get('session/latest')
  async latest(@Query() query: GetLatestQueryDto) {
    const { session, messages } = await this.svc.getLatestSession(null, query.assistantKey as any)
    return {
      sessionId: session?.id ?? null,
      messages: messages.map(m => ({ id: m.id, role: m.role, content: m.content, createdAt: m.createdAt })),
    }
  }

  @Post('messages')
  async post(@Body() body: PostMessageDto) {
    return await this.svc.postMessage({
      userId: null,
      assistantKey: body.assistantKey as any,
      sessionId: body.sessionId,
      content: body.content,
    })
  }
}
