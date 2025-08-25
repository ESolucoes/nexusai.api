import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { randomUUID } from 'crypto'
import { extname, join } from 'path'
import { existsSync, mkdirSync } from 'fs'

import { UsuariosService } from './usuarios.service'
import { Usuario } from './usuario.entity'
import { JwtAuthGuard } from '../autenticacao/jwt-auth.guard'
import { GetUsuarioDto } from './dto/get-usuario.dto'
import { GetUsuarioIDDto } from './dto/get-usuario-id.dto'
import { DeleteUsuarioDto } from './dto/delete-usuario.dto'
import { PostUsuarioDto } from './dto/post-usuario.dto'
import { PutUsuarioDto } from './dto/put-usuario.dto'
import { VigenciasService } from '../vigencias/vigencias.service'
import { MentoresService } from '../mentores/mentores.service'
import { MentoradosService } from '../mentorados/mentorados.service'
import { ListarMentoresQueryDto } from './dto/listar-mentores.query.dto'
import { GetMentoresPaginadoResponseDto } from './dto/get-mentores-paginado.dto'
import { ListarMentoradosQueryDto } from './dto/listar-mentorados.query.dto'
import { GetMentoradosPaginadoResponseDto } from './dto/get-mentorados-paginado.dto'
import { ArquivosService } from '../arquivos/arquivos.service'
import { PostUsuarioAvatarDto } from './dto/post-usuario-avatar.dto'
import { UploadAvatarResponseDto } from './dto/upload-avatar.response.dto'

@ApiTags('Usuários')
@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly vigenciasService: VigenciasService,
    private readonly mentoresService: MentoresService,
    private readonly mentoradosService: MentoradosService,
    private readonly arquivosService: ArquivosService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: [GetUsuarioDto] })
  async listarTodos(): Promise<GetUsuarioDto[]> {
    const usuarios = await this.usuariosService.listarTodos()
    return usuarios.map((u) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      telefone: u.telefone ?? null,
      criadoEm: u.criadoEm,
      atualizadoEm: u.atualizadoEm,
    }))
  }

  @Get('mentores')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: GetMentoresPaginadoResponseDto })
  async listarMentoresPaginado(
    @Query() query: ListarMentoresQueryDto,
  ): Promise<GetMentoresPaginadoResponseDto> {
    return this.usuariosService.listarMentoresPaginado(query)
  }

  @Get('mentores/count')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ schema: { example: { total: 42 } } })
  async contarMentores(): Promise<{ total: number }> {
    return this.usuariosService.contarMentores()
  }

  @Get('mentorados')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: GetMentoradosPaginadoResponseDto })
  async listarMentoradosPaginado(
    @Query() query: ListarMentoradosQueryDto,
  ): Promise<GetMentoradosPaginadoResponseDto> {
    return this.usuariosService.listarMentoradosPaginado(query)
  }

  @Get('mentorados/count')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ schema: { example: { total: 120 } } })
  async contarMentorados(): Promise<{ total: number }> {
    return this.usuariosService.contarMentorados()
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: GetUsuarioIDDto })
  async buscarPorId(@Param('id') id: string): Promise<GetUsuarioIDDto> {
    const u = await this.usuariosService.buscarPorId(id)
    const v = await this.vigenciasService.obterAtivaOuMaisRecente(id)
    const m = await this.mentoresService.buscarPorUsuarioId(id)
    const md = await this.mentoradosService.buscarPorUsuarioId(id)

    let mentoradoCompleto: GetUsuarioIDDto['mentorado'] = null
    if (md) {
      const mentor = await this.mentoresService.buscarPorId(md.mentorId).catch(() => null)
      let mentorAninhado: any = null
      if (mentor) {
        const mentorUsuario = await this.usuariosService.buscarPorId(mentor.usuarioId).catch(() => null)
        if (mentorUsuario) {
          mentorAninhado = {
            tipo: mentor.tipo as any,
            usuario: {
              nome: mentorUsuario.nome,
              email: mentorUsuario.email,
              telefone: mentorUsuario.telefone ?? null,
            },
          }
        }
      }

      const curriculo =
        md.curriculoPath && md.curriculoNome
          ? {
              storageKey: md.curriculoPath,
              filename: md.curriculoNome,
              mime: md.curriculoMime || 'application/octet-stream',
              tamanho: Number(md.curriculoTamanho || 0),
              url: this.arquivosService.buildPrivateUrl(md.curriculoPath),
            }
          : null

      mentoradoCompleto = {
        id: md.id,
        tipo: md.tipo as any,
        rg: md.rg,
        cpf: md.cpf,
        nomePai: md.nomePai,
        nomeMae: md.nomeMae,
        dataNascimento: md.dataNascimento,
        rua: md.rua,
        numero: md.numero,
        complemento: md.complemento ?? null,
        cep: md.cep,
        cargoObjetivo: md.cargoObjetivo,
        pretensaoClt: md.pretensaoClt,
        pretensaoPj: md.pretensaoPj,
        linkedin: md.linkedin,
        curriculo,
        criadoEm: md.criadoEm,
        atualizadoEm: md.atualizadoEm,
        mentor: mentorAninhado,
      }
    }

    const avatarUrl = u.avatarPath ? this.arquivosService.buildPublicUrl(u.avatarPath) : null

    return {
      id: u.id,
      nome: u.nome,
      email: u.email,
      telefone: u.telefone ?? null,
      criadoEm: u.criadoEm,
      atualizadoEm: u.atualizadoEm,
      vigenciaAtiva: v ? { id: v.id, inicio: v.inicio, fim: v.fim ?? null } : null,
      mentor: md ? null : m ? { tipo: m.tipo as any } : null,
      mentorado: mentoradoCompleto,
      avatarUrl,
    }
  }

  @Post()
  @ApiCreatedResponse({ type: Usuario })
  async criar(@Body() dto: PostUsuarioDto): Promise<Usuario> {
    return this.usuariosService.criar(dto)
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: Usuario })
  async atualizar(@Param('id') id: string, @Body() dto: PutUsuarioDto) {
    return this.usuariosService.atualizar(id, dto)
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: DeleteUsuarioDto })
  async deletar(@Param('id') id: string): Promise<DeleteUsuarioDto> {
    await this.usuariosService.deletarPorId(id)
    return { id, sucesso: true }
  }

  @Post(':id/avatar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: PostUsuarioAvatarDto })
  @ApiOkResponse({ type: UploadAvatarResponseDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const base = process.env.UPLOADS_PUBLIC_DIR || join(process.cwd(), 'uploads/public')
          const relative = join('images', 'avatars')
          const full = join(base, relative)
          if (!existsSync(full)) mkdirSync(full, { recursive: true })
          cb(null, full)
        },
        filename: (req, file, cb) => {
          const ext = (extname(file.originalname || '') || '.jpg').toLowerCase()
          cb(null, `${randomUUID()}${ext}`)
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const mime = file.mimetype || ''
        const ok = /^image\/(png|jpe?g|webp|gif)$/.test(mime)
        if (!ok) return cb(new BadRequestException('Tipo de imagem inválido'), false)
        cb(null, true)
      },
    }),
  )
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadAvatarResponseDto> {
    if (!file) throw new BadRequestException('Arquivo não recebido')
    const user = await this.usuariosService.buscarPorId(id)
    const storageKey = ['images', 'avatars', file.filename].join('/').replace(/\\/g, '/')
    user.avatarPath = storageKey
    await this.usuariosService.salvar(user)
    const url = this.arquivosService.buildPublicUrl(storageKey)
    return {
      sucesso: true,
      url,
      storageKey,
      filename: file.filename,
      mime: file.mimetype,
      tamanho: file.size,
    }
  }
}
