import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'

@Entity({ name: 'usuarios' })
export class Usuario {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ApiProperty()
  @Column({ type: 'varchar', length: 120 })
  nome: string

  @ApiProperty()
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150, unique: true })
  email: string

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'varchar', length: 20, nullable: true })
  telefone?: string | null

  @Column({ name: 'senha_hash', type: 'varchar', length: 255 })
  senhaHash: string

  @Column({ name: 'avatar_path', type: 'varchar', length: 255, nullable: true })
  avatarPath?: string | null

  @ApiProperty()
  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date

  @ApiProperty()
  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date
}
