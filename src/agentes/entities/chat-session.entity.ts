import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { ChatMessage } from './chat-message.entity'

@Entity('chat_sessions')
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string

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
