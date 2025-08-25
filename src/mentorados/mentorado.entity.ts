import { ApiProperty } from '@nestjs/swagger'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { Mentor } from '../mentores/mentor.entity'

export type MentoradoTipo = 'Executive' | 'First Class'

@Entity({ name: 'mentorados' })
@Unique('UQ_mentorado_usuario', ['usuarioId'])
export class Mentorado {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ApiProperty({ description: 'ID do usuário associado' })
  @Index()
  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string

  @ApiProperty({ description: 'ID do mentor responsável' })
  @Index()
  @Column({ name: 'mentor_id', type: 'uuid' })
  mentorId: string

  @ManyToOne(() => Mentor, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'mentor_id' })
  mentor: Mentor

  @ApiProperty({ enum: ['Executive', 'First Class'] })
  @Column({ type: 'varchar', length: 20 })
  tipo: MentoradoTipo

  @ApiProperty() @Column({ type: 'varchar', length: 20 }) rg: string
  @ApiProperty() @Column({ type: 'varchar', length: 14 }) cpf: string

  @ApiProperty() @Column({ name: 'nome_pai', type: 'varchar', length: 120 }) nomePai: string
  @ApiProperty() @Column({ name: 'nome_mae', type: 'varchar', length: 120 }) nomeMae: string

  @ApiProperty() @Column({ name: 'data_nascimento', type: 'date' }) dataNascimento: string

  @ApiProperty() @Column({ type: 'varchar', length: 150 }) rua: string
  @ApiProperty() @Column({ type: 'varchar', length: 20 }) numero: string
  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'varchar', length: 120, nullable: true })
  complemento?: string | null
  @ApiProperty() @Column({ type: 'varchar', length: 10 }) cep: string

  @ApiProperty({ description: 'Cargo ou objetivo' })
  @Column({ name: 'cargo_objetivo', type: 'varchar', length: 120 })
  cargoObjetivo: string

  @ApiProperty({ description: 'Pretensão CLT' })
  @Column({ name: 'pretensao_clt', type: 'numeric', precision: 12, scale: 2, default: 0 })
  pretensaoClt: string

  @ApiProperty({ description: 'Pretensão PJ' })
  @Column({ name: 'pretensao_pj', type: 'numeric', precision: 12, scale: 2, default: 0 })
  pretensaoPj: string

  @ApiProperty({ description: 'Link do LinkedIn' })
  @Column({ name: 'linkedin', type: 'varchar', length: 255 })
  linkedin: string

  @ApiProperty({ required: false, nullable: true })
  @Column({ name: 'curriculo_path', type: 'varchar', length: 255, nullable: true })
  curriculoPath?: string | null

  @ApiProperty({ required: false, nullable: true })
  @Column({ name: 'curriculo_nome', type: 'varchar', length: 255, nullable: true })
  curriculoNome?: string | null

  @ApiProperty({ required: false, nullable: true })
  @Column({ name: 'curriculo_mime', type: 'varchar', length: 120, nullable: true })
  curriculoMime?: string | null

  @ApiProperty({ required: false, nullable: true })
  @Column({ name: 'curriculo_tamanho', type: 'bigint', nullable: true })
  curriculoTamanho?: string | null

  @ApiProperty()
  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date

  @ApiProperty()
  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date
}
