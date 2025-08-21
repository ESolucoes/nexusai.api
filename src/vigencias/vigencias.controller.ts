import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { VigenciasService } from './vigencias.service';
import { PostVigenciaDto } from './dto/post-vigencia.dto';
import { PutVigenciaDto } from './dto/put-vigencia.dto';
import { ToggleVigenciaDto } from './dto/toggle-vigencia.dto';
import { JwtAuthGuard } from '../autenticacao/jwt-auth.guard';
import { Vigencia } from './vigencia.entity';
import { GetVigenciaDto } from './dto/get-vigencias.dto';
import { MentorGuard } from '../mentores/guards/mentor.guard';

@ApiTags('Vigências')
@Controller('vigencias')
export class VigenciasController {
  constructor(private readonly service: VigenciasService) {}

  @Get(':usuarioId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: [GetVigenciaDto] })
  async listarPorUsuario(@Param('usuarioId') usuarioId: string): Promise<GetVigenciaDto[]> {
    const lista = await this.service.listarPorUsuario(usuarioId);
    return lista.map((v) => ({
      id: v.id,
      usuarioId: v.usuarioId,
      inicio: v.inicio,
      fim: v.fim ?? null,
    }));
  }

  @Post()
  @ApiOkResponse({ type: Vigencia })
  criarPorEmail(@Body() dto: PostVigenciaDto) {
    return this.service.criarPorEmail(dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, MentorGuard)
  @ApiOkResponse({ type: Vigencia })
  atualizar(@Param('id') id: string, @Body() dto: PutVigenciaDto) {
    return this.service.atualizar(id, dto);
  }

  @Patch(':usuarioId/switch')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, MentorGuard)
  @ApiOkResponse({ schema: { example: { status: 'ativada' } } })
  toggle(@Param('usuarioId') usuarioId: string, @Body() dto: ToggleVigenciaDto) {
    return this.service.toggle(usuarioId, dto.ativo);
  }
}
