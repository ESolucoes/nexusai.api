import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarCodigosRedefinicaoSenha1710000000001 implements MigrationInterface {
  name = 'CriarCodigosRedefinicaoSenha1710000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS public;`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public."codigo_redefinicao" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL,
        "codigo" varchar(12) NOT NULL,
        "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "expiraEm" TIMESTAMPTZ NOT NULL,
        "usado" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_codigo_redefinicao_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_codigo_redefinicao_email"
      ON public."codigo_redefinicao" ("email");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_codigo_redefinicao_codigo"
      ON public."codigo_redefinicao" ("codigo");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS public."IDX_codigo_redefinicao_codigo";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS public."IDX_codigo_redefinicao_email";
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS public."codigo_redefinicao";
    `);

  }
}
