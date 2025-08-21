import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CriarChatTabelas1710000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'chat_sessions',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, isNullable: false, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'userId', type: 'varchar', isNullable: true },
        { name: 'assistantKey', type: 'varchar', isNullable: false },
        { name: 'assistantId', type: 'varchar', isNullable: false },
        { name: 'threadId', type: 'varchar', isNullable: true },
        { name: 'createdAt', type: 'timestamp with time zone', isNullable: false, default: 'CURRENT_TIMESTAMP' },
      ],
    }), true);

    await queryRunner.createIndex('chat_sessions', new TableIndex({
      name: 'IDX_chat_sessions_user_assistant',
      columnNames: ['userId', 'assistantKey'],
    }));

    await queryRunner.createTable(new Table({
      name: 'chat_messages',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, isNullable: false, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'sessionId', type: 'uuid', isNullable: false },
        { name: 'role', type: 'varchar', isNullable: false },
        { name: 'content', type: 'text', isNullable: false },
        { name: 'createdAt', type: 'timestamp with time zone', isNullable: false, default: 'CURRENT_TIMESTAMP' },
      ],
    }), true);

    await queryRunner.createForeignKey('chat_messages', new TableForeignKey({
      columnNames: ['sessionId'],
      referencedTableName: 'chat_sessions',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createIndex('chat_messages', new TableIndex({
      name: 'IDX_chat_messages_session_createdAt',
      columnNames: ['sessionId', 'createdAt'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('chat_messages', 'IDX_chat_messages_session_createdAt');
    const table = await queryRunner.getTable('chat_messages');
    if (table) {
      for (const fk of table.foreignKeys) {
        if (fk.columnNames.includes('sessionId')) {
          await queryRunner.dropForeignKey('chat_messages', fk);
        }
      }
    }
    await queryRunner.dropTable('chat_messages');
    await queryRunner.dropIndex('chat_sessions', 'IDX_chat_sessions_user_assistant');
    await queryRunner.dropTable('chat_sessions');
  }
}
