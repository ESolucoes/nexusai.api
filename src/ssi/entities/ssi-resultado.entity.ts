import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm'
import { SsiMetrica } from '../enums/ssi-metrica.enum'
import { SsiUnidade } from '../enums/ssi-unidade.enum'
import { SsiStatus } from '../enums/ssi-status.enum'

@Entity('ssi_resultados')
@Unique(['usuarioId', 'metrica', 'dataReferencia'])
@Index('idx_ssi_resultados_usuario', ['usuarioId'])
@Index('idx_ssi_resultados_data', ['dataReferencia'])
export class SsiResultado {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /** opcional: atrelar ao usuÃ¡rio/mentorado; se nÃ£o houver, deixar null */
  @Column({ name: 'usuario_id', type: 'uuid', nullable: true })
  usuarioId: string | null

  @Column({ type: 'enum', enum: SsiMetrica })
  metrica: SsiMetrica

  /** data de referÃªncia (ex.: segunda da semana) */
  @Column({ name: 'data_referencia', type: 'date' })
  dataReferencia: string

  /** valor informado (para percentual, em 0â€“100) */
  @Column({ type: 'numeric', precision: 14, scale: 4 })
  valor: string

  @Column({ type: 'enum', enum: SsiUnidade })
  unidade: SsiUnidade

  /** status calculado contra a meta (azul/verde/vermelho) */
  @Column({ type: 'enum', enum: SsiStatus })
  status: SsiStatus

  /** meta aplicada no momento do registro (para auditoria) */
  @Column({ name: 'meta_aplicada', type: 'numeric', precision: 14, scale: 4 })
  metaAplicada: string

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date
}
