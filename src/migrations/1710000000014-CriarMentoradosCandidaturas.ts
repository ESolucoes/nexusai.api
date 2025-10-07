// src/migrations/1710000000014-CriarMentoradosCandidaturas.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarMentoradosCandidaturas1710000000014 implements MigrationInterface {
  name = 'CriarMentoradosCandidaturas1710000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabela de candidaturas
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mentorados_candidaturas" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "mentoradoId" uuid NOT NULL,
        "vagaUrl" varchar(512) NOT NULL,
        "status" varchar(32) NOT NULL DEFAULT 'pendente',
        "erro" text NULL,
        "criadoEm" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "atualizadoEm" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "fk_candidatura_mentorado" FOREIGN KEY ("mentoradoId")
          REFERENCES "mentorados"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      );
    `);

    // Índices
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_candidatura_mentorado" ON "mentorados_candidaturas" ("mentoradoId");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_candidatura_status" ON "mentorados_candidaturas" ("status");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_candidatura_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_candidatura_mentorado";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mentorados_candidaturas";`);
  }
}
