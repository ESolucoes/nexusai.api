import { Injectable } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class AuthMailService {
  constructor(private readonly mailer: MailerService) {}

  async enviarCodigoRedefinicao(email: string, codigo: string, expiraEmISO: string) {
    await this.mailer.sendMail({
      to: email,
      subject: 'Código para redefinição de senha',
      template: 'solicitar-codigo',
      context: {
        email,
        codigo,
        expiraEm: new Date(expiraEmISO).toLocaleString('pt-BR'),
      },
    })
  }
}
