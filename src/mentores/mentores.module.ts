import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mentor } from './mentor.entity';
import { MentoresService } from './mentores.service';
import { MentoresController } from './mentores.controller';
import { MentorGuard } from './guards/mentor.guard';
import { MentorAdminGuard } from './guards/mentor-admin.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Mentor])],
  providers: [MentoresService, MentorGuard, MentorAdminGuard],
  controllers: [MentoresController],
  exports: [MentoresService, MentorGuard, MentorAdminGuard],
})
export class MentoresModule {}
