import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('codigo_redefinicao')
@Index(['email'])
export class CodigoRedefinicao {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 255 })
  email: string

  @Column({ type: 'varchar', length: 12 })
  codigo: string

  @CreateDateColumn({ type: 'timestamp with time zone' })
  criadoEm: Date

  @Column({ type: 'timestamp with time zone' })
  expiraEm: Date

  @Column({ type: 'boolean', default: false })
  usado: boolean
}
