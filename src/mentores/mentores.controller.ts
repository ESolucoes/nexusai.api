import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MentoresService } from './mentores.service';
import { Mentor } from './mentor.entity';
import { PostMentorDto } from './dto/post-mentor.dto';
import { PutMentorDto } from './dto/put-mentor.dto';
import { GetMentorDto } from './dto/get-mentor.dto';
import { GetMentorIDDto } from './dto/get-mentor-id.dto';
import { JwtAuthGuard } from '../autenticacao/jwt-auth.guard';
import { MentorAdminGuard } from './guards/mentor-admin.guard';

@ApiTags('Mentores')
@Controller('mentores')
export class MentoresController {
  constructor(private readonly service: MentoresService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: [GetMentorDto] })
  async listar(): Promise<GetMentorDto[]> {
    return this.service.listarIds();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: GetMentorIDDto })
  async buscarPorId(@Param('id') id: string): Promise<GetMentorIDDto> {
    const m = await this.service.buscarPorId(id);
    return {
      id: m.id,
      usuarioId: m.usuarioId,
      tipo: m.tipo as any,
      criadoEm: m.criadoEm,
      atualizadoEm: m.atualizadoEm,
    };
  }

  @Post()
  @ApiCreatedResponse({ type: Mentor })
  async criar(@Body() dto: PostMentorDto): Promise<Mentor> {
    return this.service.criar(dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, MentorAdminGuard)
  @ApiOkResponse({ type: Mentor })
  async atualizar(@Param('id') id: string, @Body() dto: PutMentorDto) {
    return this.service.atualizarTipo(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, MentorAdminGuard)
  @ApiOkResponse({ schema: { example: { sucesso: true } } })
  async deletar(@Param('id') id: string) {
    return this.service.deletar(id);
  }
}
