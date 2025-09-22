import { Injectable, NotFoundException } from '@nestjs/common'
import { join, resolve, basename } from 'path'
import {
  existsSync,
  mkdirSync,
  statSync,
  readdirSync,
  createReadStream,
  readFileSync,
  writeFileSync,
} from 'fs'
import * as mime from 'mime-types'
import type { Response } from 'express'

type CurriculoMeta = {
  filename: string
  originalName: string
  savedAt: string
}

type SavedInfo = {
  filename: string
  originalName: string
  mime: string
  size: number
  url: string
  savedAt: string
}

@Injectable()
export class MentoradoCurriculoService {
  private readonly privateBase = resolve(
    process.env.UPLOADS_PRIVATE_DIR ?? join(process.cwd(), 'uploads', 'private'),
  )

  private dirFor(mentoradoId: string) {
    return resolve(this.privateBase, 'mentorados', mentoradoId, 'curriculo')
  }

  ensureDir(mentoradoId: string) {
    const dir = this.dirFor(mentoradoId)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    return dir
  }

  /** ======= Meta (mantém compat com “último”) ======= */
  private metaPath(mentoradoId: string) {
    return resolve(this.dirFor(mentoradoId), 'latest.json')
  }
  private writeMeta(mentoradoId: string, meta: CurriculoMeta) {
    writeFileSync(this.metaPath(mentoradoId), JSON.stringify(meta), 'utf8')
  }
  private readMeta(mentoradoId: string): CurriculoMeta | null {
    try {
      const raw = readFileSync(this.metaPath(mentoradoId), 'utf8')
      const m = JSON.parse(raw)
      if (m?.filename && typeof m.filename === 'string') return m
      return null
    } catch {
      return null
    }
  }

  /** ======= Save (único) ======= */
  saveFile(mentoradoId: string, file: Express.Multer.File, originalName: string): SavedInfo {
    const abs = resolve(this.dirFor(mentoradoId), file.filename)
    const st = statSync(abs)
    const savedAt = new Date(st.mtimeMs).toISOString()

    // atualiza meta do “último”
    const meta: CurriculoMeta = {
      filename: file.filename,
      originalName: originalName || file.originalname || file.filename,
      savedAt,
    }
    this.writeMeta(mentoradoId, meta)

    return {
      filename: file.filename,
      originalName: meta.originalName,
      mime: file.mimetype || (mime.lookup(abs) as string) || 'application/octet-stream',
      size: st.size,
      url: `/mentorados/${mentoradoId}/curriculo/${encodeURIComponent(file.filename)}`,
      savedAt,
    }
  }

  /** ======= Save (múltiplos) ======= */
  saveFiles(
    mentoradoId: string,
    items: Array<{ file: Express.Multer.File; originalName: string }>,
  ): SavedInfo[] {
    const infos = items.map(({ file, originalName }) =>
      this.saveFile(mentoradoId, file, originalName),
    )
    // o saveFile já atualiza o “último” para o mais recente processado
    // (que, pela ordem, será o último do array)
    return infos
  }

  /** ======= Listar todos do diretório ======= */
  listFiles(mentoradoId: string): SavedInfo[] {
    const dir = this.dirFor(mentoradoId)
    if (!existsSync(dir)) return []

    const files = readdirSync(dir).filter((f) => {
      const fp = resolve(dir, f)
      return existsSync(fp) && statSync(fp).isFile() && f !== 'latest.json'
    })

    const mapped = files.map((f): SavedInfo => {
      const fp = resolve(dir, f)
      const st = statSync(fp)
      const type = (mime.lookup(fp) || 'application/octet-stream') as string
      return {
        filename: f,
        originalName: f, // não temos meta individual persistida; usamos o nome físico
        mime: type,
        size: st.size,
        url: `/mentorados/${mentoradoId}/curriculo/${encodeURIComponent(f)}`,
        savedAt: new Date(st.mtimeMs).toISOString(),
      }
    })

    // mais recentes primeiro
    mapped.sort((a, b) => Number(new Date(b.savedAt)) - Number(new Date(a.savedAt)))
    return mapped
  }

  /** ======= Último arquivo (usa meta e faz fallback por mtime) ======= */
  private getLatestFile(mentoradoId: string) {
    const dir = this.dirFor(mentoradoId)
    if (!existsSync(dir)) throw new NotFoundException('Currículo não encontrado')

    const meta = this.readMeta(mentoradoId)
    if (meta) {
      const p = resolve(dir, meta.filename)
      if (existsSync(p)) {
        return { path: p, originalName: meta.originalName }
      }
    }

    const files = readdirSync(dir).filter((f) => {
      const fp = resolve(dir, f)
      return existsSync(fp) && statSync(fp).isFile() && f !== 'latest.json'
    })
    if (!files.length) throw new NotFoundException('Currículo não encontrado')

    files.sort(
      (a, b) => statSync(resolve(dir, b)).mtimeMs - statSync(resolve(dir, a)).mtimeMs,
    )
    const picked = files[0]
    return { path: resolve(dir, picked), originalName: picked }
  }

  downloadLatest(mentoradoId: string, res: Response) {
    const { path: fp, originalName } = this.getLatestFile(mentoradoId)

    if (!fp.startsWith(this.privateBase)) {
      throw new NotFoundException('Currículo não encontrado')
    }

    const st = statSync(fp)
    const type = (mime.lookup(fp) || 'application/octet-stream') as string
    res.setHeader('Content-Type', type)
    res.setHeader('Content-Length', String(st.size))
    const safeName = basename(originalName || 'curriculo.pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}`,
    )

    const stream = createReadStream(fp)
    stream.on('error', () => {
      if (!res.headersSent) res.status(500).end()
    })
    return stream.pipe(res)
  }

  downloadByName(mentoradoId: string, filename: string, res: Response) {
    const fp = resolve(this.dirFor(mentoradoId), basename(filename))
    if (!fp.startsWith(this.privateBase) || !existsSync(fp) || !statSync(fp).isFile()) {
      throw new NotFoundException('Currículo não encontrado')
    }
    const st = statSync(fp)
    const type = (mime.lookup(fp) || 'application/octet-stream') as string
    res.setHeader('Content-Type', type)
    res.setHeader('Content-Length', String(st.size))
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(basename(filename))}`,
    )
    const stream = createReadStream(fp)
    stream.on('error', () => {
      if (!res.headersSent) res.status(500).end()
    })
    return stream.pipe(res)
  }
}
