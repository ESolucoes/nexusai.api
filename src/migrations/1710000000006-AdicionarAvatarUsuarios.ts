import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdicionarAvatarUsuarios1710000000006 implements MigrationInterface {
  name = 'AdicionarAvatarUsuarios1710000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "usuarios" ADD "avatar_path" varchar(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "avatar_path"`);
  }
}
