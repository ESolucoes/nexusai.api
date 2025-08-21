import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarVigencias1710000000002 implements MigrationInterface {
  name = 'CriarVigencias1710000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "vigencias" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "usuario_id" uuid NOT NULL,
        "inicio" TIMESTAMPTZ NOT NULL,
        "fim" TIMESTAMPTZ NULL,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vigencias_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vigencias_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_vigencia_usuario_ativa"
      ON "vigencias" ("usuario_id")
      WHERE "fim" IS NULL
    `);

    await queryRunner.query(`CREATE INDEX "IDX_vigencias_usuario" ON "vigencias" ("usuario_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_vigencias_inicio" ON "vigencias" ("inicio")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vigencias_inicio"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vigencias_usuario"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_vigencia_usuario_ativa"`);
    await queryRunner.query(`DROP TABLE "vigencias"`);
  }
}
