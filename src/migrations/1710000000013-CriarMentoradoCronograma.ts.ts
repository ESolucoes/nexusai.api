import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarMentoradoCronograma1710000000013 implements MigrationInterface {
  name = 'CriarMentoradoCronograma1710000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabela de semanas/tarefas
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mentorado_cronograma_semana" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "usuarioId" uuid NULL,
        "semana" varchar(32) NOT NULL,
        "meta" varchar(160) NOT NULL,
        "tarefa" text NOT NULL,
        "ordem" int NOT NULL DEFAULT 0,
        "concluido" boolean NOT NULL DEFAULT false,
        "criadoEm" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "atualizadoEm" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "fk_cronograma_semana_usuario" FOREIGN KEY ("usuarioId")
          REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_cronograma_semana_usuario" ON "mentorado_cronograma_semana" ("usuarioId");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_cronograma_semana_semana" ON "mentorado_cronograma_semana" ("semana");`);

    // Tabela de rotina fixa
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mentorado_cronograma_rotina" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "usuarioId" uuid NULL,
        "grupo" varchar(32) NOT NULL DEFAULT 'FIXA',
        "dia" varchar(32) NOT NULL,
        "titulo" varchar(200) NOT NULL,
        "ordem" int NOT NULL DEFAULT 0,
        "ativo" boolean NOT NULL DEFAULT true,
        "criadoEm" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "atualizadoEm" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "fk_cronograma_rotina_usuario" FOREIGN KEY ("usuarioId")
          REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_cronograma_rotina_usuario" ON "mentorado_cronograma_rotina" ("usuarioId");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_cronograma_rotina_usuario";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mentorado_cronograma_rotina";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_cronograma_semana_semana";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_cronograma_semana_usuario";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mentorado_cronograma_semana";`);
  }
}
