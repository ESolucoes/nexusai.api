import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MulterModule } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { ChatSession } from './entities/chat-session.entity'
import { ChatMessage } from './entities/chat-message.entity'
import { AgentesService } from './agentes.service'
import { AgentesController } from './agentes.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage]),
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  ],
  controllers: [AgentesController],
  providers: [AgentesService],
})
export class AgentesModule {}
