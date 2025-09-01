import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MailerModule } from '@nestjs-modules/mailer'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join, resolve } from 'path'

import { AutenticacaoModule } from './autenticacao/autenticacao.module'
import { UsuariosModule } from './usuarios/usuarios.module'
import { VigenciasModule } from './vigencias/vigencias.module'
import { MentoresModule } from './mentores/mentores.module'
import { MentoradosModule } from './mentorados/mentorados.module'
import { AgentesModule } from './agentes/agentes.module'
import { ArquivosModule } from './arquivos/arquivos.module'

// Se você realmente tem esse módulo criado, mantenha.
// Caso não exista, remova as 2 linhas relacionadas a ele.
import { MentoradoAudioModule } from './mentorados-audio/mentorados-audio.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // estático público (APENAS uploads/public) — caminho ABSOLUTO
    // IMPORTANTÍSSIMO: exclude '/uploads/private*' pra NÃO interceptar arquivos privados
    ServeStaticModule.forRoot({
      rootPath: resolve(process.env.UPLOADS_PUBLIC_DIR ?? join(process.cwd(), 'uploads', 'public')),
      serveRoot: '/uploads',
      exclude: ['/uploads/private*'],
      serveStaticOptions: { index: false },
    }),

    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: process.env.MAIL_HOST,
          port: Number(process.env.MAIL_PORT ?? 587),
          secure: process.env.MAIL_SECURE === 'true',
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
        },
        defaults: {
          from: process.env.MAIL_FROM ?? '"Suporte" <no-reply@nexusai.local>',
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
    }),

    AutenticacaoModule,
    UsuariosModule,
    VigenciasModule,
    MentoresModule,
    MentoradosModule,
    AgentesModule,
    ArquivosModule,

    // Se não tiver criado, REMOVA essa linha:
    MentoradoAudioModule,
  ],
})
export class AppModule {}
