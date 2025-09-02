import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vaga_links')
export class VagaLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 200 })
  titulo: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ length: 120, nullable: true })
  fonte?: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Index()
  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;
}
