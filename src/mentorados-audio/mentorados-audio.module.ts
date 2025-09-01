import { Module } from '@nestjs/common'
import { MentoradoAudioController } from './mentorados-audio.controller'
import { MentoradoAudioService } from './mentorados-audio.service'

@Module({
  controllers: [MentoradoAudioController],
  providers: [MentoradoAudioService],
  exports: [MentoradoAudioService],
})
export class MentoradoAudioModule {}
