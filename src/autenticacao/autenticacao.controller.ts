import { Body, Controller, Post } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { AutenticacaoService } from './autenticacao.service'
import { LoginDto } from './dto/login.dto'
import { PostSolicitarCodigoDto } from './dto/post-solicitar-codigo.dto'
import { PostRedefinirSenhaDto } from './dto/post-redefinir-senha.dto'

@ApiTags('Autenticação')
@Controller('autenticacao')
export class AutenticacaoController {
  constructor(private readonly authService: AutenticacaoService) {}

  @Post('login')
  @ApiOkResponse({ schema: { example: { access_token: 'jwt.aqui' } } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.senha)
  }

  @Post('senha/solicitar-codigo')
  @ApiOkResponse({
    schema: {
      example: {
        email: 'user@mail.com',
        codigo: '123456',
        expiraEm: '2025-01-01T00:15:00Z',
      },
    },
  })
  solicitarCodigo(@Body() dto: PostSolicitarCodigoDto) {
    return this.authService.solicitarCodigo(dto.email)
  }

  @Post('senha/redefinir')
  @ApiOkResponse({ schema: { example: { sucesso: true } } })
  redefinirSenha(@Body() dto: PostRedefinirSenhaDto) {
    return this.authService.redefinirSenha(dto.codigo, dto.novaSenha)
  }
}
