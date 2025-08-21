import { Injectable, NotFoundException } from '@nestjs/common'
import OpenAI from 'openai'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ChatSession } from './entities/chat-session.entity'
import { ChatMessage } from './entities/chat-message.entity'

const ASSISTANT_KEYS = ['PAUL_GPT','FAQ_NEXUS','TESTE_PERCEPCAO_VAGAS','MSG_HEADHUNTER','CALEIDOSCOPIO_CONTEUDO'] as const
type AssistantKey = typeof ASSISTANT_KEYS[number]

@Injectable()
export class AgentesService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

  constructor(
    @InjectRepository(ChatSession) private sessions: Repository<ChatSession>,
    @InjectRepository(ChatMessage) private messages: Repository<ChatMessage>,
  ) {}

  private getAssistantId(assistantKey: AssistantKey): string {
    const id = process.env[assistantKey]
    if (!id) throw new NotFoundException(`Assistant ${assistantKey} não configurado`)
    return id
  }

  async getLatestSession(userId: string | null, assistantKey: AssistantKey) {
    const where = { userId, assistantKey } as any
    const s = await this.sessions.findOne({ where, order: { createdAt: 'DESC' } })
    if (!s) return { session: null, messages: [] }
    const msgs = await this.messages.find({ where: { sessionId: s.id }, order: { createdAt: 'ASC' } })
    return { session: s, messages: msgs }
  }

  async postMessage(params: { userId: string | null, assistantKey: AssistantKey, sessionId?: string | null, content: string }) {
    const assistantId = this.getAssistantId(params.assistantKey)
    let session: ChatSession | null = null

    if (params.sessionId) {
      session = await this.sessions.findOne({ where: { id: params.sessionId } })
      if (!session) throw new NotFoundException('Sessão não encontrada')
    } else {
      session = await this.sessions.save(this.sessions.create({
        userId: params.userId ?? null,
        assistantKey: params.assistantKey,
        assistantId,
        threadId: null,
      }))
    }

    if (!session.threadId) {
      const thread = await this.openai.beta.threads.create()
      session.threadId = thread.id
      await this.sessions.save(session)
    }

    const userMsg = await this.messages.save(this.messages.create({
      sessionId: session.id, role: 'user', content: params.content,
    }))
    await this.openai.beta.threads.messages.create(session.threadId!, {
      role: 'user', content: params.content,
    })

    const run = await this.openai.beta.threads.runs.create(session.threadId!, { assistant_id: assistantId })
    let runStatus = run.status
    while (runStatus === 'queued' || runStatus === 'in_progress' || runStatus === 'cancelling') {
      await new Promise(r => setTimeout(r, 900))
      const r2 = await this.openai.beta.threads.runs.retrieve(session.threadId!, run.id)
      runStatus = r2.status
      if (runStatus === 'failed' || runStatus === 'cancelled' || runStatus === 'expired') {
        break
      }
    }

    const list = await this.openai.beta.threads.messages.list(session.threadId!, { limit: 5 })
    const lastAssistant = list.data.find(m => m.role === 'assistant')
    const replyText = (lastAssistant?.content?.map(c => ('text' in c ? c.text.value : '')).join('\n') || 'Ok.').trim()

    const assistantMsg = await this.messages.save(this.messages.create({
      sessionId: session.id, role: 'assistant', content: replyText,
    }))

    return {
      sessionId: session.id,
      reply: { id: assistantMsg.id, role: 'assistant' as const, content: assistantMsg.content, createdAt: assistantMsg.createdAt },
    }
  }
}
