import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdicionarOwnerUserIdEmVagaLinks1710000000011 implements MigrationInterface {
  name = 'AdicionarOwnerUserIdEmVagaLinks1710000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Coluna owner_user_id (uuid, nullable)
    await queryRunner.query(`
      ALTER TABLE "vaga_links"
      ADD COLUMN IF NOT EXISTS "owner_user_id" uuid
    `);

    // 2) Índice para a coluna
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_vaga_links_owner_user_id" ON "vaga_links" ("owner_user_id")
    `);

    // 3) FK para a tabela de usuários
    // Detecta automaticamente se a tabela é "usuarios" (pt) ou "users" (en)
    const hasUsuarios = await queryRunner.hasTable('usuarios');
    const refTable = hasUsuarios ? 'usuarios' : 'users';

    // Garante que não exista uma constraint com o mesmo nome antes de criar
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_vaga_links_owner_user'
        ) THEN
          ALTER TABLE "vaga_links"
          ADD CONSTRAINT "FK_vaga_links_owner_user"
          FOREIGN KEY ("owner_user_id") REFERENCES "${refTable}"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove FK se existir
    await queryRunner.query(`
      ALTER TABLE "vaga_links" DROP CONSTRAINT IF EXISTS "FK_vaga_links_owner_user"
    `);

    // Remove índice se existir
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_vaga_links_owner_user_id"
    `);

    // Remove coluna se existir
    await queryRunner.query(`
      ALTER TABLE "vaga_links" DROP COLUMN IF EXISTS "owner_user_id"
    `);
  }
}
