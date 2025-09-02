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
import { MentoradoAudioModule } from './mentorados-audio/mentorados-audio.module'
import { MentoradoCurriculoModule } from './mentorados-curriculo/mentorados-curriculo.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ServeStaticModule.forRoot({
      rootPath: resolve(process.env.UPLOADS_PUBLIC_DIR ?? join(process.cwd(), 'uploads', 'public')),
      serveRoot: '/uploads',
      exclude: ['/uploads/private*'],
      serveStaticOptions: { index: false, redirect: false },
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
          auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
        },
        defaults: {
          from: process.env.MAIL_FROM ?? '"Suporte" <no-reply@nexusai.local>',
        },
        template: {
          dir: join(process.cwd(), 'templates'),
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

    MentoradoAudioModule,
    MentoradoCurriculoModule, // ⬅️ NOVO
  ],
})
export class AppModule {}
