import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('vagas_aplicadas')
@Index('IDX_VAGA_APLICADA_URL', ['jobUrl'])
@Index('IDX_VAGA_APLICADA_MENTORADO', ['mentoradoId'])
@Index('IDX_VAGA_APLICADA_DATA', ['appliedAt'])
export class VagaAplicada {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  mentoradoId: string;

  @Column('text')
  jobUrl: string;

  @Column({ length: 500 })
  jobTitle: string;

  @Column({ length: 255 })
  company: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  appliedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}