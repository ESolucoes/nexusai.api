import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'vigencias' })
@Index('UQ_vigencia_usuario_ativa', ['usuarioId'], { unique: true, where: '"fim" IS NULL' })
export class Vigencia {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID do usuário dono da vigência' })
  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ApiProperty({ description: 'Início da vigência' })
  @Column({ type: 'timestamptz' })
  inicio: Date;

  @ApiProperty({ description: 'Fim da vigência (null = ativa)', required: false, nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  fim?: Date | null;

  @ApiProperty()
  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}
