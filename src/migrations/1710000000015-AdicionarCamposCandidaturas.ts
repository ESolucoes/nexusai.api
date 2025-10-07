// src/migrations/1710000000015-AdicionarCamposCandidaturas.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdicionarCamposCandidaturas1710000000015 implements MigrationInterface {
  name = 'AdicionarCamposCandidaturas1710000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna tipoVaga
    await queryRunner.query(`
      ALTER TABLE "mentorados_candidaturas"
      ADD COLUMN IF NOT EXISTS "tipoVaga" varchar(128) NULL;
    `);

    // Adicionar pretensaoClt
    await queryRunner.query(`
      ALTER TABLE "mentorados_candidaturas"
      ADD COLUMN IF NOT EXISTS "pretensaoClt" numeric NULL;
    `);

    // Adicionar pretensaoPj
    await queryRunner.query(`
      ALTER TABLE "mentorados_candidaturas"
      ADD COLUMN IF NOT EXISTS "pretensaoPj" numeric NULL;
    `);

    // Adicionar empresasBloqueadas
    await queryRunner.query(`
      ALTER TABLE "mentorados_candidaturas"
      ADD COLUMN IF NOT EXISTS "empresasBloqueadas" text NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "mentorados_candidaturas" DROP COLUMN IF EXISTS "empresasBloqueadas";
    `);
    await queryRunner.query(`
      ALTER TABLE "mentorados_candidaturas" DROP COLUMN IF EXISTS "pretensaoPj";
    `);
    await queryRunner.query(`
      ALTER TABLE "mentorados_candidaturas" DROP COLUMN IF EXISTS "pretensaoClt";
    `);
    await queryRunner.query(`
      ALTER TABLE "mentorados_candidaturas" DROP COLUMN IF EXISTS "tipoVaga";
    `);
  }
}
