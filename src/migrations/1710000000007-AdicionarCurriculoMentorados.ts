import { MigrationInterface, QueryRunner } from 'typeorm'

export class AdicionarCurriculoMentorados1710000000007 implements MigrationInterface {
  name = 'AdicionarCurriculoMentorados1710000000007'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "mentorados"
      ADD COLUMN IF NOT EXISTS "curriculo_path" varchar(255),
      ADD COLUMN IF NOT EXISTS "curriculo_nome" varchar(255),
      ADD COLUMN IF NOT EXISTS "curriculo_mime" varchar(100),
      ADD COLUMN IF NOT EXISTS "curriculo_tamanho" bigint
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "mentorados"
      DROP COLUMN IF EXISTS "curriculo_tamanho",
      DROP COLUMN IF EXISTS "curriculo_mime",
      DROP COLUMN IF EXISTS "curriculo_nome",
      DROP COLUMN IF EXISTS "curriculo_path"
    `)
  }
}
