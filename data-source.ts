import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { Usuario } from './src/usuarios/usuario.entity';
import { CodigoRedefinicao } from './src/autenticacao/codigo-redefinicao.entity';

import { CriarUsuarios1710000000000 } from './src/migrations/1710000000000-CriarUsuarios';
import { CriarCodigosRedefinicaoSenha1710000000001 } from './src/migrations/1710000000001-CriarCodigosRedefinicaoSenha';
import { CriarVigencias1710000000002 } from './src/migrations/1710000000002-CriarVigencias';
import { CriarMentores1710000000003 } from './src/migrations/1710000000003-CriarMentores';
import { CriarMentorados1710000000004 } from './src/migrations/1710000000004-CriarMentorados';
import { CriarChatTabelas1710000000005 } from './src/migrations/1710000000005-CriarTabelaChats';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  entities: [Usuario, CodigoRedefinicao],

  migrations: [
    CriarUsuarios1710000000000,
    CriarCodigosRedefinicaoSenha1710000000001,
    CriarVigencias1710000000002,
    CriarMentores1710000000003,
    CriarMentorados1710000000004,
    CriarChatTabelas1710000000005,
  ],

  synchronize: false,
  logging: false,
});
