import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import * as crypto from 'crypto'

import { UsuariosService } from '../usuarios/usuarios.service'
import { VigenciasService } from '../vigencias/vigencias.service'
import { CodigoRedefinicao } from './codigo-redefinicao.entity'
import { AuthMailService } from './auth-mail.service'

@Injectable()
export class AutenticacaoService {
  private readonly EXPIRA_MINUTOS = 15

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly vigenciasService: VigenciasService,
    @InjectRepository(CodigoRedefinicao)
    private readonly codigosRepo: Repository<CodigoRedefinicao>,
    private readonly authMail: AuthMailService,
  ) {}

  async login(
    email: string,
    senha: string,
  ): Promise<{ access_token: string }> {
    const usuario = await this.usuariosService.validarCredenciais(email, senha)
    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    const v = await this.vigenciasService.obterAtivaOuMaisRecente(usuario.id)
    const agora = Date.now()

    if (!v) {
      throw new UnauthorizedException('Login não permitido: vigência inativa')
    }
    if (v.fim instanceof Date && v.fim.getTime() <= agora) {
      throw new UnauthorizedException('Login não permitido: vigência inativa')
    }

    const payload = { sub: usuario.id, email: usuario.email }
    const access_token = await this.jwtService.signAsync(payload)
    return { access_token }
  }

  async solicitarCodigo(email: string) {
    if (!email) throw new BadRequestException('E-mail é obrigatório')

    const normalized = email.toLowerCase().trim()
    const usuario = await this.getUsuarioByEmail(normalized)

    if (!usuario) {
      return {
        email: normalized,
        codigo: '000000',
        expiraEm: new Date().toISOString(),
      }
    }

    const codigo = this.gerarCodigoNumerico(6)
    const expiraEm = new Date(Date.now() + this.EXPIRA_MINUTOS * 60 * 1000)

    const registro = this.codigosRepo.create({
      email: normalized,
      codigo,
      expiraEm,
      usado: false,
    })
    await this.codigosRepo.save(registro)

    await this.authMail.enviarCodigoRedefinicao(
      normalized,
      codigo,
      expiraEm.toISOString(),
    )

    return {
      email: normalized,
      codigo,
      expiraEm: expiraEm.toISOString(),
    }
  }

  async redefinirSenha(codigo: string, novaSenha: string) {
    if (!codigo || !novaSenha) {
      throw new BadRequestException('Código e nova senha são obrigatórios')
    }

    const agora = new Date()

    const registro = await this.codigosRepo.findOne({
      where: { codigo },
      order: { criadoEm: 'DESC' as any },
    })

    if (!registro || registro.usado || registro.expiraEm < agora) {
      throw new BadRequestException('Código inválido ou expirado')
    }

    const usuario = await this.getUsuarioByEmail(registro.email)
    if (!usuario) throw new BadRequestException('Usuário não encontrado')

    usuario.senhaHash = await bcrypt.hash(novaSenha, 10)
    await (this.usuariosService as any)['usuariosRepo'].save(usuario)

    registro.usado = true
    await this.codigosRepo.save(registro)

    return { sucesso: true }
  }

  private gerarCodigoNumerico(tamanho = 6) {
    const bytes = crypto.randomBytes(tamanho)
    let s = ''
    for (let i = 0; i < tamanho; i++) s += (bytes[i] % 10).toString()
    return s
  }

  private async getUsuarioByEmail(email: string) {
    const svc = this.usuariosService as any
    if (typeof svc.findByEmail === 'function') {
      return svc.findByEmail(email)
    }
    if (svc['usuariosRepo']) {
      return svc['usuariosRepo'].findOne({ where: { email } })
    }
    return null
  }
}
