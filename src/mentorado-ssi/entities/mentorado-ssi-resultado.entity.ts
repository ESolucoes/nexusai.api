// src/mentorado-ssi/entities/mentorado-ssi-resultado.entity.ts
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { MssIndicador } from '../enums/mss-indicador.enum';
import { MssStatus } from '../enums/mss-status.enum';

@Entity('mentorado_ssi_resultados')
@Index('idx_mss_usuario', ['usuarioId'])
@Index('idx_mss_indicador', ['indicador'])
@Index('idx_mss_semana', ['semanaIndex'])
export class MentoradoSsiResultado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid', nullable: true })
  usuarioId: string | null;

  @Column({ type: 'enum', enum: MssIndicador })
  indicador: MssIndicador;

  /** 1..12 */
  @Column({ name: 'semana_index', type: 'int' })
  semanaIndex: number;

  @Column({ type: 'numeric', precision: 14, scale: 4 })
  valor: string;

  @Column({ type: 'enum', enum: MssStatus })
  status: MssStatus;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}
