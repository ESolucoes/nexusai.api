// src/migrations/1710000000010-CriarSsi.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class CriarSsi1710000000010 implements MigrationInterface {
  name = 'CriarSsi1710000000010'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ExtensÃ£o de UUID (seguro caso jÃ¡ exista)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Enums
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ssi_metrica') THEN
          CREATE TYPE "ssi_metrica" AS ENUM(
            'SSI_SETOR','SSI_REDE','SSI_TOTAL',
            'PILAR_MARCA','PILAR_PESSOAS_CERTAS','PILAR_INSIGHTS','PILAR_RELACIONAMENTOS',
            'IMPRESSOES_PUBLICACAO','VISUALIZACOES_PERFIL','OCORRENCIAS_PESQUISA','TAXA_RECRUTADORES',
            'CANDIDATURAS_SIMPLIFICADAS','CANDIDATURAS_VISUALIZADAS','CURRICULOS_BAIXADOS','CONTATOS_RH',
            'PUBLICACOES_SEMANA','INTERACOES_COMENTARIOS','CONTRIBUICOES_ARTIGOS',
            'PEDIDOS_CONEXAO_HEADHUNTERS','PEDIDOS_CONEXAO_DECISORES',
            'MENSAGENS_RECRUTADORES','MENSAGENS_NETWORKING','CAFES_AGENDADOS','CAFES_TOMADOS',
            'ENTREVISTAS_REALIZADAS','ENTREVISTAS_FASE_FINAL','CARTAS_OFERTA'
          );
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ssi_unidade') THEN
          CREATE TYPE "ssi_unidade" AS ENUM('NUMERO','PERCENTUAL');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ssi_status') THEN
          CREATE TYPE "ssi_status" AS ENUM('OTIMO','BOM','RUIM');
        END IF;
      END $$;
    `);

    // Tabela de metas
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ssi_metas" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "metrica" "ssi_metrica" NOT NULL UNIQUE,
        "valorMeta" numeric(14,4) NOT NULL,
        "unidade" "ssi_unidade" NOT NULL DEFAULT 'NUMERO',
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // Tabela de resultados
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ssi_resultados" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "usuario_id" uuid,
        "metrica" "ssi_metrica" NOT NULL,
        "data_referencia" date NOT NULL,
        "valor" numeric(14,4) NOT NULL,
        "unidade" "ssi_unidade" NOT NULL,
        "status" "ssi_status" NOT NULL,
        "meta_aplicada" numeric(14,4) NOT NULL,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "uq_ssi_usuario_metrica_data" UNIQUE ("usuario_id","metrica","data_referencia")
      );
    `);

    // Ãndices
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_ssi_resultados_usuario" ON "ssi_resultados" ("usuario_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_ssi_resultados_data" ON "ssi_resultados" ("data_referencia");
    `);

    // FK opcional para usuarios (se a tabela existir)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios') THEN
          ALTER TABLE "ssi_resultados"
          ADD CONSTRAINT "fk_ssi_usuario"
          FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    // Seeds de metas (percentuais em 0â€“100)
    await queryRunner.query(`
      INSERT INTO "ssi_metas" ("metrica","valorMeta","unidade")
      VALUES
        ('SSI_SETOR'::ssi_metrica, 1, 'PERCENTUAL'::ssi_unidade),
        ('SSI_REDE'::ssi_metrica, 1, 'PERCENTUAL'::ssi_unidade),
        ('SSI_TOTAL'::ssi_metrica, 65, 'NUMERO'::ssi_unidade),

        ('PILAR_MARCA'::ssi_metrica, 18, 'NUMERO'::ssi_unidade),
        ('PILAR_PESSOAS_CERTAS'::ssi_metrica, 15, 'NUMERO'::ssi_unidade),
        ('PILAR_INSIGHTS'::ssi_metrica, 15, 'NUMERO'::ssi_unidade),
        ('PILAR_RELACIONAMENTOS'::ssi_metrica, 15, 'NUMERO'::ssi_unidade),

        ('IMPRESSOES_PUBLICACAO'::ssi_metrica, 1000, 'NUMERO'::ssi_unidade),
        ('VISUALIZACOES_PERFIL'::ssi_metrica, 100, 'NUMERO'::ssi_unidade),
        ('OCORRENCIAS_PESQUISA'::ssi_metrica, 100, 'NUMERO'::ssi_unidade),
        ('TAXA_RECRUTADORES'::ssi_metrica, 5, 'PERCENTUAL'::ssi_unidade),

        ('CANDIDATURAS_SIMPLIFICADAS'::ssi_metrica, 10, 'NUMERO'::ssi_unidade),
        ('CANDIDATURAS_VISUALIZADAS'::ssi_metrica, 3, 'NUMERO'::ssi_unidade),
        ('CURRICULOS_BAIXADOS'::ssi_metrica, 3, 'NUMERO'::ssi_unidade),
        ('CONTATOS_RH'::ssi_metrica, 2, 'NUMERO'::ssi_unidade),

        ('PUBLICACOES_SEMANA'::ssi_metrica, 3, 'NUMERO'::ssi_unidade),
        ('INTERACOES_COMENTARIOS'::ssi_metrica, 10, 'NUMERO'::ssi_unidade),
        ('CONTRIBUICOES_ARTIGOS'::ssi_metrica, 1, 'NUMERO'::ssi_unidade),

        ('PEDIDOS_CONEXAO_HEADHUNTERS'::ssi_metrica, 50, 'NUMERO'::ssi_unidade),
        ('PEDIDOS_CONEXAO_DECISORES'::ssi_metrica, 50, 'NUMERO'::ssi_unidade),
        ('MENSAGENS_RECRUTADORES'::ssi_metrica, 10, 'NUMERO'::ssi_unidade),
        ('MENSAGENS_NETWORKING'::ssi_metrica, 10, 'NUMERO'::ssi_unidade),
        ('CAFES_AGENDADOS'::ssi_metrica, 2, 'NUMERO'::ssi_unidade),
        ('CAFES_TOMADOS'::ssi_metrica, 1, 'NUMERO'::ssi_unidade),

        ('ENTREVISTAS_REALIZADAS'::ssi_metrica, 2, 'NUMERO'::ssi_unidade),
        ('ENTREVISTAS_FASE_FINAL'::ssi_metrica, 1, 'NUMERO'::ssi_unidade),
        ('CARTAS_OFERTA'::ssi_metrica, 1, 'NUMERO'::ssi_unidade)
      ON CONFLICT (metrica) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover FK se existir
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE table_name = 'ssi_resultados'
            AND constraint_name = 'fk_ssi_usuario'
        ) THEN
          ALTER TABLE "ssi_resultados" DROP CONSTRAINT "fk_ssi_usuario";
        END IF;
      END $$;
    `);

    // Remover Ã­ndices
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_ssi_resultados_usuario";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_ssi_resultados_data";`);

    // Tabelas
    await queryRunner.query(`DROP TABLE IF EXISTS "ssi_resultados";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ssi_metas";`);

    // Tipos
    await queryRunner.query(`DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ssi_status') THEN DROP TYPE "ssi_status"; END IF;
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ssi_unidade') THEN DROP TYPE "ssi_unidade"; END IF;
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ssi_metrica') THEN DROP TYPE "ssi_metrica"; END IF;
    END $$;`);
  }
}
