import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { VagasLinksService } from './vagas-links.service';
import { PostVagaLinkDto } from './dto/post-vaga-link.dto';
import { PutVagaLinkDto } from './dto/put-vaga-link.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

function pickUserIdFromReq(req: any): string {
  const u = req?.user || {};
  const candidates = [u.id, u.sub, u.usuarioId, u.userId, u.uid];
  const found = candidates.find((v: any) => typeof v === 'string' && v.trim().length > 0);
  if (!found) throw new Error('Usuário inválido no token');
  return String(found);
}

@ApiTags('Vagas Links')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('vagas-links')
export class VagasLinksController {
  constructor(private readonly service: VagasLinksService) {}

  @Post()
  create(@Req() req: any, @Body() dto: PostVagaLinkDto) {
    const userId = pickUserIdFromReq(req);
    return this.service.createForOwner(userId, dto);
  }

  @Get()
  list(@Req() req: any, @Query('pagina') pagina?: string, @Query('quantidade') quantidade?: string) {
    const userId = pickUserIdFromReq(req);
    return this.service.listMine(userId, Number(pagina), Number(quantidade));
  }

  @Get(':id')
  find(@Req() req: any, @Param('id') id: string) {
    const userId = pickUserIdFromReq(req);
    return this.service.findOneMine(userId, id);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: PutVagaLinkDto) {
    const userId = pickUserIdFromReq(req);
    return this.service.updateMine(userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    const userId = pickUserIdFromReq(req);
    return this.service.removeMine(userId, id);
  }
}
