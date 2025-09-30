// src/migrations/1710000000012-RemoverSsi.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoverSsi1710000000012 implements MigrationInterface {
  name = 'RemoverSsi1710000000012'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remover índices/constraints se existirem
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_ssi_resultados_usuario"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_ssi_resultados_data"`);

    // Remover tabelas (ordem importa por FK/uso de tipos)
    await queryRunner.query(`DROP TABLE IF EXISTS "ssi_resultados"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ssi_metas"`);

    // Remover TIPOS ENUM do Postgres (criados pelo módulo SSI)
    await queryRunner.query(`DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ssi_status') THEN
        DROP TYPE "ssi_status";
      END IF;
    END $$;`);

    await queryRunner.query(`DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ssi_unidade') THEN
        DROP TYPE "ssi_unidade";
      END IF;
    END $$;`);

    await queryRunner.query(`DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ssi_metrica') THEN
        DROP TYPE "ssi_metrica";
      END IF;
    END $$;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recria TIPOS ENUM
    await queryRunner.query(`CREATE TYPE "ssi_metrica" AS ENUM (
      'SSI_SETOR','SSI_REDE','SSI_TOTAL',
      'PILAR_MARCA','PILAR_PESSOAS_CERTAS','PILAR_INSIGHTS','PILAR_RELACIONAMENTOS',
      'IMPRESSOES_PUBLICACAO','VISUALIZACOES_PERFIL','OCORRENCIAS_PESQUISA','TAXA_RECRUTADORES',
      'CANDIDATURAS_SIMPLIFICADAS','CANDIDATURAS_VISUALIZADAS','CURRICULOS_BAIXADOS','CONTATOS_RH',
      'PUBLICACOES_SEMANA','INTERACOES_COMENTARIOS','CONTRIBUICOES_ARTIGOS',
      'PEDIDOS_CONEXAO_HEADHUNTERS','PEDIDOS_CONEXAO_DECISORES','MENSAGENS_RECRUTADORES','MENSAGENS_NETWORKING',
      'CAFES_AGENDADOS','CAFES_TOMADOS',
      'ENTREVISTAS_REALIZADAS','ENTREVISTAS_FASE_FINAL','CARTAS_OFERTA'
    )`);

    await queryRunner.query(`CREATE TYPE "ssi_unidade" AS ENUM ('NUMERO','PERCENTUAL')`);

    await queryRunner.query(`CREATE TYPE "ssi_status" AS ENUM ('OTIMO','BOM','RUIM')`);

    // Recria TABELAS
    await queryRunner.query(`
      CREATE TABLE "ssi_metas" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "metrica" "ssi_metrica" NOT NULL,
        "valorMeta" numeric(14,4) NOT NULL,
        "unidade" "ssi_unidade" NOT NULL DEFAULT 'NUMERO',
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ssi_metas_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ssi_metas_metrica" UNIQUE ("metrica")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "ssi_resultados" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "usuario_id" uuid,
        "metrica" "ssi_metrica" NOT NULL,
        "data_referencia" date NOT NULL,
        "valor" numeric(14,4) NOT NULL,
        "unidade" "ssi_unidade" NOT NULL,
        "status" "ssi_status" NOT NULL,
        "meta_aplicada" numeric(14,4) NOT NULL,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ssi_resultados_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ssi_resultados_usuario_metrica_data" UNIQUE ("usuario_id","metrica","data_referencia")
      )
    `);

    // Recria índices
    await queryRunner.query(`CREATE INDEX "idx_ssi_resultados_usuario" ON "ssi_resultados" ("usuario_id")`);
    await queryRunner.query(`CREATE INDEX "idx_ssi_resultados_data" ON "ssi_resultados" ("data_referencia")`);
  }
}
