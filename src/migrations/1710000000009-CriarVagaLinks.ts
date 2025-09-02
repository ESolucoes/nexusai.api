// src/migrations/1710000000009-CriarVagaLinks.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class CriarVagaLinks1710000000009 implements MigrationInterface {
  name = 'CriarVagaLinks1710000000009'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "vaga_links" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "titulo" character varying(200) NOT NULL,
        "url" text NOT NULL,
        "fonte" character varying(120),
        "descricao" text,
        "ativo" boolean NOT NULL DEFAULT true,
        "criado_em" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vaga_links_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_vaga_links_titulo" ON "vaga_links" ("titulo")`);
    await queryRunner.query(`CREATE INDEX "IDX_vaga_links_ativo" ON "vaga_links" ("ativo")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vaga_links_ativo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vaga_links_titulo"`);
    await queryRunner.query(`DROP TABLE "vaga_links"`);
  }
}
