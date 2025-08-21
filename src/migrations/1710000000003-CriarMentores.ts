import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarMentores1710000000003 implements MigrationInterface {
  name = 'CriarMentores1710000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mentores (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id uuid NOT NULL,
        tipo varchar(20) NOT NULL,
        criado_em timestamptz NOT NULL DEFAULT now(),
        atualizado_em timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_mentores_tipo CHECK (tipo IN ('admin','normal')),
        CONSTRAINT "UQ_mentor_usuario" UNIQUE (usuario_id),
        CONSTRAINT "FK_mentores_usuarios" 
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mentores_usuario_id"
      ON mentores(usuario_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS mentores;`);
  }
}
