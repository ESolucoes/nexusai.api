import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarMentorados1710000000004 implements MigrationInterface {
  name = 'CriarMentorados1710000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mentorados (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id uuid NOT NULL,
        mentor_id uuid NOT NULL,
        tipo varchar(20) NOT NULL,
        rg varchar(20) NOT NULL,
        cpf varchar(14) NOT NULL,
        nome_pai varchar(120) NOT NULL,
        nome_mae varchar(120) NOT NULL,
        data_nascimento date NOT NULL,
        rua varchar(150) NOT NULL,
        numero varchar(20) NOT NULL,
        complemento varchar(120),
        cep varchar(10) NOT NULL,
        cargo_objetivo varchar(120) NOT NULL,
        pretensao_clt numeric(12,2) NOT NULL DEFAULT 0,
        pretensao_pj numeric(12,2) NOT NULL DEFAULT 0,
        linkedin varchar(255) NOT NULL,
        criado_em timestamptz NOT NULL DEFAULT now(),
        atualizado_em timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_mentorado_tipo CHECK (tipo IN ('Executive','First Class')),
        CONSTRAINT "UQ_mentorado_usuario" UNIQUE (usuario_id),
        CONSTRAINT "FK_mentorados_usuarios"
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        CONSTRAINT "FK_mentorados_mentores"
          FOREIGN KEY (mentor_id) REFERENCES mentores(id) ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mentorados_usuario_id"
      ON mentorados(usuario_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mentorados_mentor_id"
      ON mentorados(mentor_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS mentorados;`);
  }
}
