import { Body, Controller, Post, Get, Req, UseGuards, Param, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LinkedInCandidatorService } from './linkedin/linkedin-candidator.service';
import { IniciarAutomacaoDto } from './dto/iniciar-automacao.dto';
import { MentoradosService } from '../mentorados/mentorados.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Candidaturas LinkedIn')
@Controller('mentorados-candidatura')
@ApiBearerAuth()
export class MentoradosCandidaturaController {
  constructor(
    private readonly linkedinCandidator: LinkedInCandidatorService,
    private readonly mentoradosService: MentoradosService
  ) {}

  @Get('meu-mentorado')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Obter mentorado do usuário logado' })
  async getMeuMentorado(@Req() req: any) {
    const usuarioId = req.user.id;
    const mentorado = await this.mentoradosService.buscarPorUsuarioId(usuarioId);
    
    if (!mentorado) {
      throw new Error('Mentorado não encontrado para este usuário');
    }
    
    return {
      id: mentorado.id,
      cargoObjetivo: mentorado.cargoObjetivo,
      pretensaoClt: mentorado.pretensaoClt,
      pretensaoPj: mentorado.pretensaoPj,
      linkedin: mentorado.linkedin
    };
  }

  @Post('iniciar-automacao')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Iniciar automação completa com informações do mentorado' })
  async iniciarAutomacaoCompleta(
    @Body() config: IniciarAutomacaoDto,
    @Req() req: any
  ): Promise<{ success: boolean; results: any[]; message: string }> {
    
    // Validações
    if (!config.email || !config.password) {
      throw new BadRequestException('Email e senha são obrigatórios');
    }

    if (!config.tipoVaga || config.tipoVaga.trim() === '') {
      throw new BadRequestException('Tipo de vaga é obrigatório');
    }

    // Buscar mentoradoId do usuário logado se não fornecido
    let mentoradoId = config.mentoradoId;
    if (!mentoradoId) {
      const usuarioId = req.user.id;
      const mentorado = await this.mentoradosService.buscarPorUsuarioId(usuarioId);
      if (!mentorado) {
        throw new BadRequestException('Mentorado não encontrado para este usuário');
      }
      mentoradoId = mentorado.id;
    }

    // Configuração com valores padrão
    const serviceConfig = {
      ...config,
      mentoradoId,
      empresasBloqueadas: config.empresasBloqueadas || [],
      maxAplicacoes: config.maxAplicacoes || 5,
      respostasChat: config.respostasChat || {
        disponibilidade: '',
        avisoPrevio: '',
        interesse: '',
        pretensaoSalarial: '',
        pretensaoPj: '',
        localizacao: '',
        experiencia: '',
        outrasPerguntas: '',
        respostaPadrao: ''
      }
    };
    
    console.log(`🎯 Iniciando automação para mentorado: ${mentoradoId}`);
    
    return this.linkedinCandidator.iniciarAutomacaoCompleta(serviceConfig);
  }

  @Get('verificar-mentorado/:id')
  @ApiOperation({ summary: 'Verificar se mentorado existe' })
  async verificarMentorado(@Param('id') id: string) {
    try {
      const mentorado = await this.mentoradosService.buscarPorId(id);
      return {
        existe: true,
        mentorado: {
          id: mentorado.id,
          cargoObjetivo: mentorado.cargoObjetivo,
          pretensaoClt: mentorado.pretensaoClt,
          pretensaoPj: mentorado.pretensaoPj
        }
      };
    } catch (error) {
      return {
        existe: false,
        error: error.message
      };
    }
  }
}