import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarUsuarios1710000000000 implements MigrationInterface {
  name = 'CriarUsuarios1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "usuarios" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nome" varchar(120) NOT NULL,
        "email" varchar(150) NOT NULL,
        "telefone" varchar(20),
        "senha_hash" varchar(255) NOT NULL,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_usuarios_email" UNIQUE ("email"),
        CONSTRAINT "PK_usuarios_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "usuarios"`);
  }
}
