import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class AdicionarCurriculoMentorados1710000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('mentorados', [
      new TableColumn({
        name: 'curriculo_path',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'curriculo_nome',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'curriculo_mime',
        type: 'varchar',
        length: '120',
        isNullable: true,
      }),
      new TableColumn({
        name: 'curriculo_tamanho',
        type: 'bigint',
        isNullable: true,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('mentorados', 'curriculo_tamanho')
    await queryRunner.dropColumn('mentorados', 'curriculo_mime')
    await queryRunner.dropColumn('mentorados', 'curriculo_nome')
    await queryRunner.dropColumn('mentorados', 'curriculo_path')
  }
}
