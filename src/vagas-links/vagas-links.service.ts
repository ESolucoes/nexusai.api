import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VagaLink } from './vaga-link.entity';
import { PostVagaLinkDto } from './dto/post-vaga-link.dto';
import { PutVagaLinkDto } from './dto/put-vaga-link.dto';

function normalizeUrl(raw: string) {
  if (!raw) return raw;
  return /^https?:\/\//i.test(raw) ? raw.trim() : `https://${raw.trim()}`;
}

function titleFromUrl(u: string) {
  try { return new URL(u).hostname; } catch { return u.slice(0, 200); }
}

function fonteFromUrl(u: string) {
  try { return new URL(u).hostname.replace(/^www\./i, ''); } catch { return undefined; }
}

@Injectable()
export class VagasLinksService {
  constructor(@InjectRepository(VagaLink) private readonly repo: Repository<VagaLink>) {}

  async create(dto: PostVagaLinkDto) {
    const url = normalizeUrl(dto.url);
    const titulo = (dto.titulo?.trim() || titleFromUrl(url)).slice(0, 200);
    const fonte = dto.fonte?.trim() || fonteFromUrl(url);

    const entity = this.repo.create({
      ...dto,
      url,
      titulo,            // entidade exige titulo NOT NULL (da migration), então garantimos aqui
      fonte,
      ativo: dto.ativo ?? true,
    });

    return this.repo.save(entity);
  }

  async list(pagina = 1, quantidade = 20) {
    const take = Math.min(Math.max(Number(quantidade) || 20, 1), 100);
    const page = Math.max(Number(pagina) || 1, 1);
    const skip = (page - 1) * take;

    const [itens, total] = await this.repo.findAndCount({
      where: { ativo: true },
      order: { criadoEm: 'DESC' },
      take,
      skip,
    });

    return { itens, total, pagina: page, quantidade: take };
  }

  findOne(id: string) { return this.repo.findOneBy({ id }); }

  async update(id: string, dto: PutVagaLinkDto) {
    if (dto.url) dto.url = normalizeUrl(dto.url);
    await this.repo.update({ id }, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.delete({ id });
    return { ok: true };
  }
}
