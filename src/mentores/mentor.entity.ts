import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

export type MentorTipo = 'admin' | 'normal';

@Entity({ name: 'mentores' })
@Unique('UQ_mentor_usuario', ['usuarioId'])
export class Mentor {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID do usuário associado' })
  @Index()
  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @ApiProperty({ enum: ['admin', 'normal'] })
  @Column({ type: 'varchar', length: 20 })
  tipo: MentorTipo;

  @ApiProperty()
  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}
