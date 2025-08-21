import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mentor } from './mentor.entity';
import { PostMentorDto } from './dto/post-mentor.dto';
import { PutMentorDto } from './dto/put-mentor.dto';

@Injectable()
export class MentoresService {
  constructor(
    @InjectRepository(Mentor)
    private readonly mentorRepo: Repository<Mentor>,
  ) {}

  async isMentor(usuarioId: string): Promise<boolean> {
    const m = await this.mentorRepo.findOne({ where: { usuarioId } });
    return !!m;
  }

  async isAdmin(usuarioId: string): Promise<boolean> {
    const m = await this.mentorRepo.findOne({ where: { usuarioId } });
    return !!m && m.tipo === 'admin';
  }

  async listarIds(): Promise<{ id: string; tipo: 'admin' | 'normal' }[]> {
    const rows = await this.mentorRepo.find({ select: ['id', 'tipo'] });
    return rows.map(r => ({ id: r.id, tipo: r.tipo as 'admin' | 'normal' }));
  }

  async buscarPorId(id: string): Promise<Mentor> {
    const m = await this.mentorRepo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Mentor não encontrado');
    return m;
  }

  async buscarPorUsuarioId(usuarioId: string): Promise<Mentor | null> {
    return this.mentorRepo.findOne({ where: { usuarioId } });
  }

  async criar(dto: PostMentorDto): Promise<Mentor> {
    const ja = await this.mentorRepo.findOne({ where: { usuarioId: dto.usuarioId } });
    if (ja) throw new ConflictException('Usuário já possui mentor vinculado');

    const mentor = this.mentorRepo.create({
      usuarioId: dto.usuarioId,
      tipo: dto.tipo,
    });
    return this.mentorRepo.save(mentor);
  }

  async atualizarTipo(id: string, dto: PutMentorDto): Promise<Mentor> {
    const m = await this.buscarPorId(id);
    m.tipo = dto.tipo;
    return this.mentorRepo.save(m);
  }

  async deletar(id: string): Promise<{ sucesso: boolean }> {
    const res = await this.mentorRepo.delete(id);
    if (res.affected === 0) throw new NotFoundException('Mentor não encontrado');
    return { sucesso: true };
  }
}
