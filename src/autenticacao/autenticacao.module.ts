import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MailerModule } from '@nestjs-modules/mailer'

import { AutenticacaoController } from './autenticacao.controller'
import { AutenticacaoService } from './autenticacao.service'
import { AuthMailService } from './auth-mail.service'
import { JwtStrategy } from './jwt.strategy'
import { CodigoRedefinicao } from './codigo-redefinicao.entity'

import { UsuariosModule } from '../usuarios/usuarios.module'
import { VigenciasModule } from '../vigencias/vigencias.module'

@Module({
  imports: [
    UsuariosModule,
    VigenciasModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([CodigoRedefinicao]),
    MailerModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET ?? 'dev_secret_troque_esto',
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? '1d' },
      }),
    }),
  ],
  controllers: [AutenticacaoController],
  providers: [AutenticacaoService, AuthMailService, JwtStrategy],
  exports: [AutenticacaoService],
})
export class AutenticacaoModule {}
