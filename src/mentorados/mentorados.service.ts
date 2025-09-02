import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Mentorado } from './mentorado.entity'
import { PostMentoradoDto } from './dto/post-mentorado.dto'
import { PutMentoradoDto } from './dto/put-mentorado.dto'
import { MentoresService } from '../mentores/mentores.service'

@Injectable()
export class MentoradosService {
  constructor(
    @InjectRepository(Mentorado)
    private readonly repo: Repository<Mentorado>,
    private readonly mentoresService: MentoresService,
  ) {}

  async buscarPorUsuarioId(usuarioId: string): Promise<Mentorado | null> {
    return this.repo.findOne({ where: { usuarioId } })
  }

  async listar(): Promise<{ id: string; usuarioId: string; mentorId: string; tipo: 'Executive' | 'First Class' }[]> {
    const rows = await this.repo.find({ select: ['id', 'usuarioId', 'mentorId', 'tipo'] })
    return rows.map(r => ({ id: r.id, usuarioId: r.usuarioId, mentorId: r.mentorId, tipo: r.tipo as any }))
  }

  async buscarPorId(id: string): Promise<Mentorado> {
    const m = await this.repo.findOne({ where: { id } })
    if (!m) throw new NotFoundException('Mentorado não encontrado')
    return m
  }

  async criar(dto: PostMentoradoDto): Promise<Mentorado> {
    const ja = await this.repo.findOne({ where: { usuarioId: dto.usuarioId } })
    if (ja) throw new ConflictException('Usuário já possui mentorado vinculado')

    const mentor = await this.mentoresService.buscarPorId(dto.mentorId).catch(() => null)
    if (!mentor) throw new BadRequestException('Mentor informado não existe')

    const ment = this.repo.create({
      ...dto,
      complemento: dto.complemento ?? null,
      pretensaoClt: String(dto.pretensaoClt ?? 0),
      pretensaoPj: String(dto.pretensaoPj ?? 0),
    })
    return this.repo.save(ment)
  }

  async atualizar(id: string, dto: PutMentoradoDto): Promise<Mentorado> {
    const m = await this.buscarPorId(id)

    if (dto.mentorId !== undefined) {
      const mentor = await this.mentoresService.buscarPorId(dto.mentorId).catch(() => null)
      if (!mentor) throw new BadRequestException('Mentor informado não existe')
      m.mentorId = dto.mentorId
    }

    if (dto.tipo !== undefined) m.tipo = dto.tipo
    if (dto.rg !== undefined) m.rg = dto.rg
    if (dto.cpf !== undefined) m.cpf = dto.cpf
    if (dto.nomePai !== undefined) m.nomePai = dto.nomePai
    if (dto.nomeMae !== undefined) m.nomeMae = dto.nomeMae
    if (dto.dataNascimento !== undefined) m.dataNascimento = dto.dataNascimento
    if (dto.rua !== undefined) m.rua = dto.rua
    if (dto.numero !== undefined) m.numero = dto.numero
    if (dto.complemento !== undefined) m.complemento = dto.complemento ?? null
    if (dto.cep !== undefined) m.cep = dto.cep
    if (dto.cargoObjetivo !== undefined) m.cargoObjetivo = dto.cargoObjetivo
    if (dto.pretensaoClt !== undefined) m.pretensaoClt = String(dto.pretensaoClt)
    if (dto.pretensaoPj !== undefined) m.pretensaoPj = String(dto.pretensaoPj)
    if (dto.linkedin !== undefined) m.linkedin = dto.linkedin

    return this.repo.save(m)
  }

  async deletar(id: string): Promise<{ sucesso: boolean }> {
    const res = await this.repo.delete(id)
    if (res.affected === 0) throw new NotFoundException('Mentorado não encontrado')
    return { sucesso: true }
  }
}
