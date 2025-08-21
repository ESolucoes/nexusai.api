// src/agentes/entities/chat-session.entity.ts
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { ChatMessage } from './chat-message.entity'

@Entity('chat_sessions')
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string

  // se sua migration criou userId como varchar, mantenha varchar aqui
  @Column({ type: 'varchar', nullable: true })
  userId: string | null

  @Column({ type: 'varchar' })
  assistantKey: string

  @Column({ type: 'varchar' })
  assistantId: string

  @Column({ type: 'varchar', nullable: true })
  threadId: string | null

  @CreateDateColumn()
  createdAt: Date

  @OneToMany(() => ChatMessage, (m) => m.session)
  messages: ChatMessage[]
}
