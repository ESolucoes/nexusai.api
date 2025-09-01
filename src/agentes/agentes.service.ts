import { Injectable, NotFoundException } from '@nestjs/common'
import OpenAI from 'openai'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, Repository } from 'typeorm'
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
    const where = userId ? { userId, assistantKey } : { userId: IsNull(), assistantKey }
    const s = await this.sessions.findOne({ where, order: { createdAt: 'DESC' } })
    if (!s) return { session: null, messages: [] }
    const msgs = await this.messages.find({ where: { sessionId: s.id }, order: { createdAt: 'ASC' } })
    return { session: s, messages: msgs }
  }

  async getSessionById(sessionId: string) {
    const s = await this.sessions.findOne({ where: { id: sessionId } })
    if (!s) throw new NotFoundException('Sessão não encontrada')
    const msgs = await this.messages.find({ where: { sessionId }, order: { createdAt: 'ASC' } })
    return { session: s, messages: msgs }
  }

  async listSessions(userId: string | null, assistantKey: AssistantKey) {
    const params: any[] = [assistantKey]
    const userFilter = userId === null ? 's."userId" IS NULL' : 's."userId" = $2'
    if (userId !== null) params.push(userId)

    const rows = await this.sessions.query(
      `
      WITH sess AS (
        SELECT s.id, s."createdAt"
        FROM chat_sessions s
        WHERE s."assistantKey" = $1
          AND ${userFilter}
      ),
      last_msg AS (
        SELECT DISTINCT ON (m."sessionId")
          m."sessionId",
          m."createdAt" AS "lastMessageAt",
          SUBSTRING(m.content FROM 1 FOR 160) AS "lastSnippet"
        FROM chat_messages m
        WHERE m."sessionId" IN (SELECT id FROM sess)
        ORDER BY m."sessionId", m."createdAt" DESC
      ),
      counts AS (
        SELECT m."sessionId", COUNT(*)::int AS "totalMessages"
        FROM chat_messages m
        WHERE m."sessionId" IN (SELECT id FROM sess)
        GROUP BY m."sessionId"
      )
      SELECT
        se.id,
        se."createdAt",
        COALESCE(lm."lastMessageAt", se."createdAt") AS "lastMessageAt",
        COALESCE(lm."lastSnippet", '')               AS "lastSnippet",
        COALESCE(ct."totalMessages", 0)              AS "totalMessages"
      FROM sess se
      LEFT JOIN last_msg lm ON lm."sessionId" = se.id
      LEFT JOIN counts  ct ON ct."sessionId"  = se.id
      ORDER BY "lastMessageAt" DESC;
      `,
      params
    )

    const sessions = rows.map((r: any) => ({
      id: r.id,
      createdAt: r.createdAt,
      lastMessageAt: r.lastMessageAt,
      lastSnippet: r.lastSnippet ?? '',
      totalMessages: Number(r.totalMessages ?? 0),
    }))

    return { sessions }
  }

  /** Monta o conteúdo para a API do OpenAI */
  private buildMessageContent(content: string | undefined | null, files: Express.Multer.File[] | undefined) {
    const parts: any[] = []
    const text = (content ?? '').trim()
    if (text) parts.push({ type: 'text', text })

    for (const file of files ?? []) {
      const isImage = String(file.mimetype || '').toLowerCase().startsWith('image/')
      if (isImage) {
        const b64 = file.buffer.toString('base64')
        const dataUrl = `data:${file.mimetype};base64,${b64}`
        parts.push({ type: 'image_url', image_url: { url: dataUrl } })
      } else {
        // Para documentos, adicionamos um marcador textual.
        // (Se tiver storage e URL pública, substitua pela URL real.)
        const humanSize = `${Math.ceil(file.size / 1024)} KB`
        parts.push({
          type: 'text',
          text: `📎 Documento recebido: ${file.originalname} (${file.mimetype}, ${humanSize}).`
        })
      }
    }

    if (parts.length === 0) parts.push({ type: 'text', text: ' ' })
    return parts
  }

  private extractAssistantText(msg?: OpenAI.Beta.Threads.Messages.Message): string {
    if (!msg?.content) return ''
    try {
      return msg.content
        .map((c: any) => {
          if (c.type === 'text' && c.text?.value) return String(c.text.value)
          if (typeof c.text === 'string') return c.text
          return ''
        })
        .filter(Boolean)
        .join('\n')
        .trim()
    } catch {
      return ''
    }
  }

  async postMessage(params: {
    userId: string | null
    assistantKey: AssistantKey
    sessionId?: string | null
    content: string
    files?: Express.Multer.File[]
  }) {
    const assistantId = this.getAssistantId(params.assistantKey)

    let session: ChatSession | null = null
    if (params.sessionId) {
      session = await this.sessions.findOne({ where: { id: params.sessionId } })
      if (!session) throw new NotFoundException('Sessão não encontrada')
      if (session.userId !== params.userId) throw new NotFoundException('Sessão não encontrada')
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

    await this.messages.save(this.messages.create({
      sessionId: session.id,
      role: 'user',
      content: params.content ?? '',
    }))

    const contentParts = this.buildMessageContent(params.content, params.files)
    try {
      await this.openai.beta.threads.messages.create(session.threadId!, {
        role: 'user',
        content: contentParts as any,
      })
    } catch {
      const assistantMsg = await this.messages.save(this.messages.create({
        sessionId: session.id,
        role: 'assistant',
        content: 'Não consegui enviar sua mensagem ao modelo agora. Tente novamente.',
      }))
      return {
        sessionId: session.id,
        reply: {
          id: assistantMsg.id,
          role: 'assistant' as const,
          content: assistantMsg.content,
          createdAt: assistantMsg.createdAt,
        },
      }
    }

    let replyText = 'Ok.'
    try {
      const run = await this.openai.beta.threads.runs.create(session.threadId!, { assistant_id: assistantId })
      let status = run.status
      let tries = 0
      const MAX_TRIES = 18
      while (['queued', 'in_progress', 'cancelling'].includes(status) && tries < MAX_TRIES) {
        await new Promise(r => setTimeout(r, 1000))
        tries++
        const r2 = await this.openai.beta.threads.runs.retrieve(session.threadId!, run.id)
        status = r2.status
        if (['failed', 'cancelled', 'expired'].includes(status)) break
      }
      const list = await this.openai.beta.threads.messages.list(session.threadId!, { limit: 10 })
      const lastAssistant = list.data.find(m => m.role === 'assistant')
      const extracted = this.extractAssistantText(lastAssistant)
      replyText = extracted || 'Ok.'
    } catch {
      replyText = 'Não consegui gerar a resposta agora. Tente novamente.'
    }

    const assistantMsg = await this.messages.save(this.messages.create({
      sessionId: session.id,
      role: 'assistant',
      content: replyText,
    }))

    return {
      sessionId: session.id,
      reply: {
        id: assistantMsg.id,
        role: 'assistant' as const,
        content: assistantMsg.content,
        createdAt: assistantMsg.createdAt,
      },
    }
  }
}
