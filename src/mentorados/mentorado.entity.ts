// backend/src/mentorados/mentorado.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'mentorados' })
export class Mentorado {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string

  @Column({ name: 'mentor_id', type: 'uuid' })
  mentorId: string

  @Column({ type: 'varchar', length: 20 })
  tipo: 'Executive' | 'First Class'

  @Column({ type: 'varchar', length: 20, nullable: true })
  rg?: string | null

  @Column({ type: 'varchar', length: 20, nullable: true })
  cpf?: string | null

  @Column({ name: 'nome_pai', type: 'varchar', length: 120, nullable: true })
  nomePai?: string | null

  @Column({ name: 'nome_mae', type: 'varchar', length: 120, nullable: true })
  nomeMae?: string | null

  @Column({ name: 'data_nascimento', type: 'date', nullable: true })
  dataNascimento?: string | null

  @Column({ type: 'varchar', length: 120, nullable: true })
  rua?: string | null

  @Column({ type: 'varchar', length: 20, nullable: true })
  numero?: string | null

  @Column({ type: 'varchar', length: 120, nullable: true })
  complemento?: string | null

  @Column({ type: 'varchar', length: 9, nullable: true })
  cep?: string | null

  @Column({ name: 'cargo_objetivo', type: 'varchar', length: 120, nullable: true })
  cargoObjetivo?: string | null

  @Column({ name: 'pretensao_clt', type: 'varchar', length: 30, nullable: true })
  pretensaoClt?: string | null

  @Column({ name: 'pretensao_pj', type: 'varchar', length: 30, nullable: true })
  pretensaoPj?: string | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  linkedin?: string | null

  /* ====== CAMPOS DO CURRÍCULO (FALTANDO NA TABELA) ====== */
  @Column({ name: 'curriculo_path', type: 'varchar', length: 255, nullable: true })
  curriculoPath?: string | null

  @Column({ name: 'curriculo_nome', type: 'varchar', length: 255, nullable: true })
  curriculoNome?: string | null

  @Column({ name: 'curriculo_mime', type: 'varchar', length: 100, nullable: true })
  curriculoMime?: string | null

  // pode ser bigint na base; string aqui funciona também
  @Column({ name: 'curriculo_tamanho', type: 'bigint', nullable: true })
  curriculoTamanho?: string | null
  /* ======================================================= */

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date
}
