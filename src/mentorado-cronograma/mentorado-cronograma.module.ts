import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MentoradoCronogramaService } from './mentorado-cronograma.service';
import { MentoradoCronogramaController } from './mentorado-cronograma.controller';
import { CronogramaSemana } from './cronograma-semana.entity';
import { CronogramaRotina } from './cronograma-rotina.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CronogramaSemana, CronogramaRotina])],
  providers: [MentoradoCronogramaService],
  controllers: [MentoradoCronogramaController],
  exports: [MentoradoCronogramaService],
})
export class MentoradoCronogramaModule {}
