import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { Usuario } from './usuario.entity'
import { PostUsuarioDto } from './dto/post-usuario.dto'
import { PutUsuarioDto } from './dto/put-usuario.dto'
import { ListarMentoresQueryDto } from './dto/listar-mentores.query.dto'
import { GetMentoresPaginadoResponseDto, MentorUsuarioResumoDto } from './dto/get-mentores-paginado.dto'
import { ListarMentoradosQueryDto } from './dto/listar-mentorados.query.dto'
import { GetMentoradosPaginadoResponseDto, MentoradoUsuarioResumoDto } from './dto/get-mentorados-paginado.dto'
import { ArquivosService } from '../arquivos/arquivos.service'

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepo: Repository<Usuario>,
    private readonly arquivosService: ArquivosService, // 🔥 ADICIONADO
  ) {}

  // 🔥 CORREÇÃO: Usar o serviço de arquivos para construir URLs
  private buildAvatarUrl(path?: string | null): string | null {
    if (!path) return null
    // 🔥 CORREÇÃO: Usar URL absoluta em produção
    return this.arquivosService.buildPublicUrl(path, { absolute: true })
  }

  async salvar(u: Usuario): Promise<Usuario> {
    return this.usuariosRepo.save(u)
  }

  async criar(dto: PostUsuarioDto): Promise<Usuario> {
    const jaExiste = await this.usuariosRepo.findOne({ where: { email: dto.email.toLowerCase() } })
    if (jaExiste) throw new ConflictException('E-mail já cadastrado')
    const senhaHash = await bcrypt.hash(dto.senha, 10)
    const usuario = this.usuariosRepo.create({
      nome: dto.nome.trim(),
      email: dto.email.toLowerCase().trim(),
      telefone: dto.telefone?.trim() || null,
      senhaHash,
    })
    return this.usuariosRepo.save(usuario)
  }

  async listarTodos(): Promise<Usuario[]> {
    return this.usuariosRepo.find()
  }

  async buscarPorId(id: string): Promise<Usuario> {
    const usuario = await this.usuariosRepo.findOne({ where: { id } })
    if (!usuario) throw new NotFoundException('Usuário não encontrado')
    return usuario
  }

  async atualizar(id: string, dto: PutUsuarioDto): Promise<Usuario> {
    const usuario = await this.buscarPorId(id)
    if (dto.email && dto.email.toLowerCase() !== usuario.email) {
      const jaExiste = await this.usuariosRepo.findOne({ where: { email: dto.email.toLowerCase() } })
      if (jaExiste) throw new ConflictException('E-mail já cadastrado')
      usuario.email = dto.email.toLowerCase().trim()
    }
    if (dto.nome) usuario.nome = dto.nome.trim()
    if (dto.telefone !== undefined) usuario.telefone = dto.telefone?.trim() || null
    if (dto.novaSenha) usuario.senhaHash = await bcrypt.hash(dto.novaSenha, 10)
    return this.usuariosRepo.save(usuario)
  }

  async deletarPorId(id: string): Promise<{ sucesso: boolean }> {
    const res = await this.usuariosRepo.delete(id)
    if (res.affected === 0) throw new NotFoundException('Usuário não encontrado')
    return { sucesso: true }
  }

  async validarCredenciais(email: string, senha: string): Promise<Usuario | null> {
    const usuario = await this.usuariosRepo.findOne({ where: { email: email.toLowerCase() } })
    if (!usuario) return null
    const ok = await bcrypt.compare(senha, usuario.senhaHash)
    return ok ? usuario : null
  }

  async listarMentoresPaginado(query: ListarMentoresQueryDto): Promise<GetMentoresPaginadoResponseDto> {
    const page = query.page && query.page > 0 ? query.page : 1
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20
    const skip = (page - 1) * limit

    const qbBase = this.usuariosRepo.createQueryBuilder('u').innerJoin('mentores', 'm', 'm.usuario_id = u.id')
    if (query.nome) qbBase.andWhere('u.nome ILIKE :nome', { nome: `%${query.nome}%` })
    if (query.email) qbBase.andWhere('u.email ILIKE :email', { email: `%${query.email}%` })
    if (query.telefone) qbBase.andWhere("COALESCE(u.telefone, '') ILIKE :telefone", { telefone: `%${query.telefone}%` })
    if (query.tipo) qbBase.andWhere('m.tipo = :tipo', { tipo: query.tipo })

    const total = await qbBase.clone().select('m.id').distinct(true).getCount()

    const rows = await qbBase
      .clone()
      .leftJoin('mentorados', 'md', 'md.mentor_id = m.id')
      .select([
        'm.id AS "mentorId"',
        'u.id AS "usuarioId"',
        'u.nome AS nome',
        'u.email AS email',
        'u.telefone AS telefone',
        'u.criado_em AS "criadoEm"',
        'u.atualizado_em AS "atualizadoEm"',
        'm.tipo AS tipo',
        'u.avatar_path AS "avatarPath"',
        'COUNT(md.id)::int AS mentorados',
      ])
      .groupBy('m.id')
      .addGroupBy('u.id')
      .addGroupBy('u.nome')
      .addGroupBy('u.email')
      .addGroupBy('u.telefone')
      .addGroupBy('u.criado_em')
      .addGroupBy('u.atualizado_em')
      .addGroupBy('u.avatar_path')
      .addGroupBy('m.tipo')
      .orderBy('u.nome', 'ASC')
      .offset(skip)
      .limit(limit)
      .getRawMany<{
        mentorId: string
        usuarioId: string
        nome: string
        email: string
        telefone: string | null
        criadoEm: Date
        atualizadoEm: Date
        tipo: 'admin' | 'normal' | string
        mentorados: number
        avatarPath: string | null
      }>()

    const items: MentorUsuarioResumoDto[] = rows.map((r) => ({
      id: r.mentorId,
      usuarioId: r.usuarioId,
      nome: r.nome,
      email: r.email,
      telefone: r.telefone ?? null,
      criadoEm: new Date(r.criadoEm),
      atualizadoEm: new Date(r.atualizadoEm),
      tipo: (r.tipo as any) === 'admin' ? 'admin' : 'normal',
      mentorados: Number(r.mentorados ?? 0),
      avatarUrl: this.buildAvatarUrl(r.avatarPath ?? null),
    }))

    const totalPages = Math.max(1, Math.ceil(total / limit))
    return { items, meta: { total, page, limit, totalPages } }
  }

  async listarMentoradosPaginado(query: ListarMentoradosQueryDto): Promise<GetMentoradosPaginadoResponseDto> {
    const page = query.page && query.page > 0 ? query.page : 1
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20
    const skip = (page - 1) * limit

    const qbBase = this.usuariosRepo.createQueryBuilder('u').innerJoin('mentorados', 'md', 'md.usuario_id = u.id')
    if (query.nome) qbBase.andWhere('u.nome ILIKE :nome', { nome: `%${query.nome}%` })
    if (query.email) qbBase.andWhere('u.email ILIKE :email', { email: `%${query.email}%` })
    if (query.telefone) qbBase.andWhere("COALESCE(u.telefone, '') ILIKE :telefone", { telefone: `%${query.telefone}%` })
    if (query.rg) qbBase.andWhere('md.rg ILIKE :rg', { rg: `%${query.rg}%` })
    if (query.cpf) qbBase.andWhere('md.cpf ILIKE :cpf', { cpf: `%${query.cpf}%` })
    if (query.tipo) qbBase.andWhere('md.tipo = :tipo', { tipo: query.tipo })

    const total = await qbBase.clone().select('u.id').distinct(true).getCount()

    const rows = await qbBase
      .clone()
      .select([
        'u.id AS id',
        'u.nome AS nome',
        'u.email AS email',
        'u.telefone AS telefone',
        'u.criado_em AS "criadoEm"',
        'u.atualizado_em AS "atualizadoEm"',
        'md.tipo AS tipo',
        'md.rg AS rg',
        'md.cpf AS cpf',
        'u.avatar_path AS "avatarPath"',
      ])
      .orderBy('u.nome', 'ASC')
      .offset(skip)
      .limit(limit)
      .getRawMany<{
        id: string
        nome: string
        email: string
        telefone: string | null
        criadoEm: Date
        atualizadoEm: Date
        tipo: 'Executive' | 'First Class' | string
        rg: string
        cpf: string
        avatarPath: string | null
      }>()

    const items: MentoradoUsuarioResumoDto[] = rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      email: r.email,
      telefone: r.telefone ?? null,
      criadoEm: new Date(r.criadoEm),
      atualizadoEm: new Date(r.atualizadoEm),
      tipo: r.tipo === 'Executive' ? 'Executive' : 'First Class',
      rg: r.rg,
      cpf: r.cpf,
      avatarUrl: this.buildAvatarUrl(r.avatarPath ?? null),
    }))

    const totalPages = Math.max(1, Math.ceil(total / limit))
    return { items, meta: { total, page, limit, totalPages } }
  }

  async contarMentores(): Promise<{ total: number }> {
    const row = await this.usuariosRepo
      .createQueryBuilder('u')
      .innerJoin('mentores', 'm', 'm.usuario_id = u.id')
      .select('COUNT(DISTINCT m.id)', 'total')
      .getRawOne<{ total: string | number }>()
    return { total: Number(row?.total ?? 0) }
  }

  async contarMentorados(): Promise<{ total: number }> {
    const row = await this.usuariosRepo
      .createQueryBuilder('u')
      .innerJoin('mentorados', 'md', 'md.usuario_id = u.id')
      .select('COUNT(DISTINCT u.id)', 'total')
      .getRawOne<{ total: string | number }>()
    return { total: Number(row?.total ?? 0) }
  }
}