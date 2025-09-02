import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { VagasLinksService } from './vagas-links.service';
import { PostVagaLinkDto } from './dto/post-vaga-link.dto';
import { PutVagaLinkDto } from './dto/put-vaga-link.dto';

@Controller('vagas-links')
export class VagasLinksController {
  constructor(private readonly service: VagasLinksService) {}

  @Post()
  create(@Body() dto: PostVagaLinkDto) {
    return this.service.create(dto);
  }

  @Get()
  list(@Query('pagina') pagina?: string, @Query('quantidade') quantidade?: string) {
    return this.service.list(Number(pagina), Number(quantidade));
  }

  @Get(':id')
  find(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: PutVagaLinkDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
