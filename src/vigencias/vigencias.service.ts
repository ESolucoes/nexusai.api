import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Vigencia } from './vigencia.entity';
import { PostVigenciaDto } from './dto/post-vigencia.dto';
import { PutVigenciaDto } from './dto/put-vigencia.dto';
import { Usuario } from '../usuarios/usuario.entity';

@Injectable()
export class VigenciasService {
  constructor(
    @InjectRepository(Vigencia)
    private readonly vigRepo: Repository<Vigencia>,
    @InjectRepository(Usuario)
    private readonly usuariosRepo: Repository<Usuario>,
  ) {}

  private assertInicioValido(inicio: Date) {
    const agora = new Date();
    if (inicio.getTime() < agora.getTime()) {
      throw new BadRequestException('Início não pode ser no passado');
    }
  }

  private assertFimValido(inicio?: Date, fim?: Date | null) {
    if (fim && inicio && fim.getTime() <= inicio.getTime()) {
      throw new BadRequestException('Fim deve ser maior que o início');
    }
  }

  async buscarPorId(id: string): Promise<Vigencia> {
    const v = await this.vigRepo.findOne({ where: { id } });
    if (!v) throw new NotFoundException('Vigência não encontrada');
    return v;
  }

  async listarPorUsuario(usuarioId: string): Promise<Vigencia[]> {
    return this.vigRepo.find({
      where: { usuarioId },
      order: { inicio: 'DESC' },
    });
  }

  async obterAtiva(usuarioId: string): Promise<Vigencia | null> {
    return this.vigRepo
      .createQueryBuilder('v')
      .where('v.usuario_id = :usuarioId', { usuarioId })
      .andWhere('v.fim IS NULL')
      .orderBy('v.inicio', 'DESC')
      .getOne();
  }

  async obterAtivaOuMaisRecente(usuarioId: string): Promise<Vigencia | null> {
    return this.vigRepo
      .createQueryBuilder('v')
      .where('v.usuario_id = :usuarioId', { usuarioId })
      .orderBy('CASE WHEN v.fim IS NULL THEN 1 ELSE 0 END', 'DESC')
      .addOrderBy('v.inicio', 'DESC')
      .limit(1)
      .getOne();
  }

  async criarPorEmail(dto: PostVigenciaDto): Promise<Vigencia> {
    const email = dto.email.trim().toLowerCase();
    console.log('📧 Criando vigência para email:', email);

    const usuario = await this.usuariosRepo.findOne({ where: { email } });
    if (!usuario) {
      console.log('❌ Usuário não encontrado para email:', email);
      throw new NotFoundException(
        'Usuário não encontrado pelo e-mail informado',
      );
    }

    console.log('✅ Usuário encontrado:', usuario.id, usuario.email);
    const vigencia = await this.criar(usuario.id, {
      inicio: dto.inicio,
      fim: dto.fim,
    });
    console.log('✅ Vigência criada com ID:', vigencia.id);

    return vigencia;
  }

  async criar(
    usuarioId: string,
    dto: { inicio: string; fim?: string },
  ): Promise<Vigencia> {
    const inicio = new Date(dto.inicio);
    const fim = dto.fim ? new Date(dto.fim) : null;

    this.assertInicioValido(inicio);
    this.assertFimValido(inicio, fim ?? undefined);

    if (!fim) {
      const jaAtiva = await this.obterAtiva(usuarioId);
      if (jaAtiva)
        throw new BadRequestException(
          'Já existe vigência ativa para este usuário',
        );
    }

    const obj = this.vigRepo.create({ usuarioId, inicio, fim });
    return this.vigRepo.save(obj);
  }

  async atualizar(id: string, dto: PutVigenciaDto): Promise<Vigencia> {
    const v = await this.vigRepo.findOne({ where: { id } });
    if (!v) throw new NotFoundException('Vigência não encontrada');

    const novoInicio = dto.inicio ? new Date(dto.inicio) : v.inicio;
    const novoFim =
      dto.fim === undefined ? v.fim : dto.fim ? new Date(dto.fim) : null;

    if (dto.inicio) this.assertInicioValido(novoInicio);
    this.assertFimValido(novoInicio, novoFim ?? undefined);

    if (novoFim === null) {
      const outraAtiva = await this.vigRepo.findOne({
        where: { usuarioId: v.usuarioId, fim: IsNull(), id: Not(v.id) },
      });
      if (outraAtiva)
        throw new BadRequestException(
          'Já existe outra vigência ativa para este usuário',
        );
    }

    v.inicio = novoInicio;
    v.fim = novoFim;
    return this.vigRepo.save(v);
  }

  async toggle(
    usuarioId: string,
    ativo: boolean,
  ): Promise<{ status: 'ativada' | 'desativada' }> {
    const agora = new Date();
    const atual = await this.obterAtiva(usuarioId);

    if (!ativo) {
      if (!atual)
        throw new BadRequestException('Não há vigência ativa para desativar');
      atual.fim = agora;
      await this.vigRepo.save(atual);
      return { status: 'desativada' };
    }

    if (atual)
      throw new BadRequestException('Usuário já possui vigência ativa');
    const nova = this.vigRepo.create({ usuarioId, inicio: agora, fim: null });
    await this.vigRepo.save(nova);
    return { status: 'ativada' };
  }
}
