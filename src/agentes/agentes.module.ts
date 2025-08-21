import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ChatSession } from './entities/chat-session.entity'
import { ChatMessage } from './entities/chat-message.entity'
import { AgentesService } from './agentes.service'
import { AgentesController } from './agentes.controller'

@Module({
  imports: [TypeOrmModule.forFeature([ChatSession, ChatMessage])],
  controllers: [AgentesController],
  providers: [AgentesService],
})
export class AgentesModule {}
