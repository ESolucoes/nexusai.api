import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('mentorado_cronograma_rotina')
@Index('idx_cronograma_rotina_usuario', ['usuarioId'])
export class CronogramaRotina {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  usuarioId!: string | null; // null = template global

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  usuario?: Usuario | null;

  @Column({ type: 'varchar', length: 32, default: 'FIXA' })
  grupo!: string; // “FIXA” por padrão (pode evoluir)

  @Column({ type: 'varchar', length: 32 })
  dia!: string; // Segunda, Terça, Quarta, Quinta, Sexta

  @Column({ type: 'varchar', length: 200 })
  titulo!: string;

  @Column({ type: 'int', default: 0 })
  ordem!: number;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  criadoEm!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  atualizadoEm!: Date;
}
