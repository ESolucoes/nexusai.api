import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CriarVagasAplicadas1710000000016 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'vagas_aplicadas',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'mentoradoId',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'jobUrl',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'jobTitle',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'company',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'appliedAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Criar índices para melhor performance
    await queryRunner.createIndex(
      'vagas_aplicadas',
      new TableIndex({
        name: 'IDX_VAGA_APLICADA_URL',
        columnNames: ['jobUrl'],
      }),
    );

    await queryRunner.createIndex(
      'vagas_aplicadas',
      new TableIndex({
        name: 'IDX_VAGA_APLICADA_MENTORADO',
        columnNames: ['mentoradoId'],
      }),
    );

    await queryRunner.createIndex(
      'vagas_aplicadas',
      new TableIndex({
        name: 'IDX_VAGA_APLICADA_DATA',
        columnNames: ['appliedAt'],
      }),
    );

    console.log('✅ Tabela vagas_aplicadas criada com sucesso');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('vagas_aplicadas');
    console.log('❌ Tabela vagas_aplicadas removida');
  }
}