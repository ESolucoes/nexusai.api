// src/usuarios/usuarios.controller.ts
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
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { UsuariosService } from './usuarios.service';
import { Usuario } from './usuario.entity';
import { JwtAuthGuard } from '../autenticacao/jwt-auth.guard';
import { GetUsuarioDto } from './dto/get-usuario.dto';
import { GetUsuarioIDDto } from './dto/get-usuario-id.dto';
import { DeleteUsuarioDto } from './dto/delete-usuario.dto';
import { PostUsuarioDto } from './dto/post-usuario.dto';
import { PutUsuarioDto } from './dto/put-usuario.dto';
import { VigenciasService } from '../vigencias/vigencias.service';
import { MentoresService } from '../mentores/mentores.service';
import { MentoradosService } from '../mentorados/mentorados.service';
import { ListarMentoresQueryDto } from './dto/listar-mentores.query.dto';
import { GetMentoresPaginadoResponseDto } from './dto/get-mentores-paginado.dto';
import { ListarMentoradosQueryDto } from './dto/listar-mentorados.query.dto';
import { GetMentoradosPaginadoResponseDto } from './dto/get-mentorados-paginado.dto';
import { ArquivosService } from '../arquivos/arquivos.service';

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
    const usuarios = await this.usuariosService.listarTodos();
    return usuarios.map((u) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      telefone: u.telefone ?? null,
      criadoEm: u.criadoEm,
      atualizadoEm: u.atualizadoEm,
    }));
  }

  @Get('mentores')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: GetMentoresPaginadoResponseDto })
  async listarMentoresPaginado(
    @Query() query: ListarMentoresQueryDto,
  ): Promise<GetMentoresPaginadoResponseDto> {
    return this.usuariosService.listarMentoresPaginado(query);
  }

  @Get('mentores/count')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ schema: { example: { total: 42 } } })
  async contarMentores(): Promise<{ total: number }> {
    return this.usuariosService.contarMentores();
  }

  @Get('mentorados')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: GetMentoradosPaginadoResponseDto })
  async listarMentoradosPaginado(
    @Query() query: ListarMentoradosQueryDto,
  ): Promise<GetMentoradosPaginadoResponseDto> {
    return this.usuariosService.listarMentoradosPaginado(query);
  }

  @Get('mentorados/count')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ schema: { example: { total: 120 } } })
  async contarMentorados(): Promise<{ total: number }> {
    return this.usuariosService.contarMentorados();
  }

  // 🔥 NOVA ROTA ADICIONADA - GET PARA AVATAR
  @Get(':id/avatar')
  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ 
    schema: { 
      example: { 
        avatarUrl: "https://processosniper.com.br/uploads/images/avatars/arquivo.jpg",
        avatarPath: "images/avatars/arquivo.jpg" 
      } 
    } 
  })
  async getAvatar(@Param('id') id: string) {
    const user = await this.usuariosService.buscarPorId(id);
    if (!user || !user.avatarPath) {
      throw new NotFoundException('Avatar não encontrado');
    }
    
    return {
      avatarUrl: this.arquivosService.buildPublicUrl(user.avatarPath, { absolute: true }),
      avatarPath: user.avatarPath
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: GetUsuarioIDDto })
  async buscarPorId(@Param('id') id: string): Promise<GetUsuarioIDDto> {
    const u = await this.usuariosService.buscarPorId(id);
    const v = await this.vigenciasService.obterAtivaOuMaisRecente(id);
    const m = await this.mentoresService.buscarPorUsuarioId(id);
    const md = await this.mentoradosService.buscarPorUsuarioId(id);

    let mentoradoCompleto: GetUsuarioIDDto['mentorado'] = null;
    if (md) {
      const mentor = md?.mentorId
        ? await this.mentoresService.buscarPorId(md.mentorId).catch(() => null)
        : null;

      let mentorAninhado: any = null;
      if (mentor) {
        const mentorUsuario = await this.usuariosService
          .buscarPorId(mentor.usuarioId)
          .catch(() => null);
        if (mentorUsuario) {
          mentorAninhado = {
            tipo: mentor.tipo as any,
            usuario: {
              nome: mentorUsuario.nome,
              email: mentorUsuario.email,
              telefone: mentorUsuario.telefone ?? null,
            },
          };
        }
      }

      mentoradoCompleto = {
        id: md.id,
        tipo: md.tipo as any,

        rg: md.rg ?? '',
        cpf: md.cpf ?? '',
        nomePai: md.nomePai ?? '',
        nomeMae: md.nomeMae ?? '',
        dataNascimento: (md.dataNascimento as any) ?? '',
        rua: md.rua ?? '',
        numero: md.numero ?? '',
        complemento: md.complemento ?? null,
        cep: md.cep ?? '',
        cargoObjetivo: md.cargoObjetivo ?? '',
        pretensaoClt: md.pretensaoClt ?? '',
        pretensaoPj: md.pretensaoPj ?? '',
        linkedin: md.linkedin ?? '',

        curriculo: null,
        criadoEm: md.criadoEm,
        atualizadoEm: md.atualizadoEm,
        mentor: mentorAninhado,
      };
    }

    const avatarUrl = u.avatarPath
      ? this.arquivosService.buildPublicUrl(u.avatarPath, { absolute: true })
      : null;

    return {
      id: u.id,
      nome: u.nome,
      email: u.email,
      telefone: u.telefone ?? null,
      criadoEm: u.criadoEm,
      atualizadoEm: u.atualizadoEm,
      vigenciaAtiva: v
        ? { id: v.id, inicio: v.inicio, fim: v.fim ?? null }
        : null,
      mentor: md ? null : m ? { tipo: m.tipo as any } : null,
      mentorado: mentoradoCompleto,
      avatarUrl,
    };
  }

  @Post()
  @ApiCreatedResponse({ type: Usuario })
  async criar(@Body() dto: PostUsuarioDto): Promise<Usuario> {
    return this.usuariosService.criar(dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: Usuario })
  async atualizar(@Param('id') id: string, @Body() dto: PutUsuarioDto) {
    return this.usuariosService.atualizar(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: DeleteUsuarioDto })
  async deletar(@Param('id') id: string): Promise<DeleteUsuarioDto> {
    await this.usuariosService.deletarPorId(id);
    return { id, sucesso: true };
  }
}