import 'dotenv/config'
import 'reflect-metadata'
import { DataSource } from 'typeorm'

import { Usuario } from './usuarios/usuario.entity'
import { CodigoRedefinicao } from './autenticacao/codigo-redefinicao.entity'

import { CriarUsuarios1710000000000 } from './migrations/1710000000000-CriarUsuarios'
import { CriarCodigosRedefinicaoSenha1710000000001 } from './migrations/1710000000001-CriarCodigosRedefinicaoSenha'
import { CriarVigencias1710000000002 } from './migrations/1710000000002-CriarVigencias'
import { CriarMentores1710000000003 } from './migrations/1710000000003-CriarMentores'
import { CriarMentorados1710000000004 } from './migrations/1710000000004-CriarMentorados'
import { CriarChatTabelas1710000000005 } from './migrations/1710000000005-CriarTabelaChats'
import { AdicionarAvatarUsuarios1710000000006 } from './migrations/1710000000006-AdicionarAvatarUsuarios'
import { AdicionarCurriculoMentorados1710000000007 } from './migrations/1710000000007-AdicionarCurriculoMentorados'
import { RemoverCurriculoMentorados1710000000008 } from './migrations/1710000000008-RemoverCurriculoMentorados'
import { CriarVagaLinks1710000000009 } from './migrations/1710000000009-CriarVagaLinks'
import { CriarSsi1710000000010 } from './migrations/1710000000010-CriarSsi'
import { AdicionarOwnerUserIdEmVagaLinks1710000000011 } from './migrations/1710000000011-AdicionarOwnerUserIdEmVagaLinks'

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
    AdicionarAvatarUsuarios1710000000006,
    AdicionarCurriculoMentorados1710000000007,
    RemoverCurriculoMentorados1710000000008,
    CriarVagaLinks1710000000009,
    CriarSsi1710000000010,
    AdicionarOwnerUserIdEmVagaLinks1710000000011,
  ],
  synchronize: false,
  logging: false,
})
