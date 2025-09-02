import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm'
import { SsiMetrica } from '../enums/ssi-metrica.enum'
import { SsiUnidade } from '../enums/ssi-unidade.enum'

@Entity('ssi_metas')
@Unique(['metrica'])
export class SsiMeta {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'enum', enum: SsiMetrica })
  metrica: SsiMetrica

  /** valor da meta (para percentual, guardar em 0â€“100, ex: 5 = 5%) */
  @Column({ type: 'numeric', precision: 14, scale: 4 })
  valorMeta: string

  @Column({ type: 'enum', enum: SsiUnidade, default: SsiUnidade.NUMERO })
  unidade: SsiUnidade

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date
}
