import { Injectable, NotFoundException } from '@nestjs/common';
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

  async createForOwner(ownerUserId: string, dto: PostVagaLinkDto) {
    const url = normalizeUrl(dto.url);
    const titulo = (dto.titulo?.trim() || titleFromUrl(url)).slice(0, 200);
    const fonte = dto.fonte?.trim() || fonteFromUrl(url);

    const entity = this.repo.create({
      ...dto,
      url,
      titulo,
      fonte,
      ativo: dto.ativo ?? true,
      ownerUserId,
    });

    return this.repo.save(entity);
  }

  async listMine(ownerUserId: string, pagina = 1, quantidade = 20) {
    const take = Math.min(Math.max(Number(quantidade) || 20, 1), 100);
    const page = Math.max(Number(pagina) || 1, 1);
    const skip = (page - 1) * take;

    const [itens, total] = await this.repo.findAndCount({
      where: { ativo: true, ownerUserId },
      order: { criadoEm: 'DESC' },
      take,
      skip,
    });

    return { itens, total, pagina: page, quantidade: take };
  }

  async findOneMine(ownerUserId: string, id: string) {
    const row = await this.repo.findOne({ where: { id, ownerUserId } });
    if (!row) throw new NotFoundException('Link não encontrado');
    return row;
  }

  async updateMine(ownerUserId: string, id: string, dto: PutVagaLinkDto) {
    if (dto.url) dto.url = normalizeUrl(dto.url);
    const exists = await this.repo.findOne({ where: { id, ownerUserId } });
    if (!exists) throw new NotFoundException('Link não encontrado');
    await this.repo.update({ id, ownerUserId }, dto as any);
    return this.findOneMine(ownerUserId, id);
  }

  async removeMine(ownerUserId: string, id: string) {
    const exists = await this.repo.findOne({ where: { id, ownerUserId } });
    if (!exists) throw new NotFoundException('Link não encontrado');
    await this.repo.delete({ id, ownerUserId });
    return { ok: true };
  }
}
