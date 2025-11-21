// src/migrations/1710000000017-AlterarLinkedinNullable.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterarLinkedinNullable1710000000017
  implements MigrationInterface
{
  name = 'AlterarLinkedinNullable1710000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Alterar a coluna linkedin para permitir NULL
    await queryRunner.query(`
      ALTER TABLE "mentorados" 
      ALTER COLUMN "linkedin" DROP NOT NULL
    `);

    console.log('✅ Coluna linkedin alterada para permitir NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter: tornar a coluna NOT NULL novamente
    await queryRunner.query(`
      ALTER TABLE "mentorados" 
      ALTER COLUMN "linkedin" SET NOT NULL
    `);

    console.log('❌ Coluna linkedin revertida para NOT NULL');
  }
}
