import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Mentorado } from './mentorado.entity'
import { MentoradosService } from './mentorados.service'
import { MentoradosController } from './mentorados.controller'
import { MentoresModule } from '../mentores/mentores.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Mentorado]),
    forwardRef(() => MentoresModule),
  ],
  providers: [MentoradosService],
  controllers: [MentoradosController],
  exports: [MentoradosService],
})
export class MentoradosModule {}
