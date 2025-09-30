import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('mentorado_cronograma_semana')
@Index('idx_cronograma_semana_usuario', ['usuarioId'])
@Index('idx_cronograma_semana_semana', ['semana'])
export class CronogramaSemana {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  usuarioId!: string | null; // null = template global

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  usuario?: Usuario | null;

  @Column({ type: 'varchar', length: 32 })
  semana!: string; // ex.: "Semana 1", "Semana 2 a 4", ...

  @Column({ type: 'varchar', length: 160 })
  meta!: string;

  @Column({ type: 'text' })
  tarefa!: string;

  @Column({ type: 'int', default: 0 })
  ordem!: number;

  @Column({ type: 'boolean', default: false })
  concluido!: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  criadoEm!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  atualizadoEm!: Date;
}
