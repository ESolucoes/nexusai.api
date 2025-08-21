import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { ChatSession } from './chat-session.entity'

export type ChatRole = 'user' | 'assistant' | 'system' | 'tool'

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  sessionId: string

  @ManyToOne(() => ChatSession, (s) => s.messages, { onDelete: 'CASCADE' })
  session: ChatSession

  @Column({ type: 'varchar' })
  role: ChatRole

  @Column({ type: 'text' })
  content: string

  @CreateDateColumn()
  createdAt: Date
}
