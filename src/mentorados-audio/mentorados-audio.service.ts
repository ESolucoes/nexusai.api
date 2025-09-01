import { Injectable, NotFoundException } from '@nestjs/common'
import { join, resolve } from 'path'
import { existsSync, mkdirSync, readdirSync, statSync, createReadStream } from 'fs'
import type { Request, Response } from 'express'
import * as mime from 'mime-types'

export type MentoradoAudioInfo = {
  filename: string
  mime: string
  size: number
  url: string
  savedAt: string
}

@Injectable()
export class MentoradoAudioService {
  private readonly privateBase = resolve(
    process.env.UPLOADS_PRIVATE_DIR ?? join(process.cwd(), 'uploads', 'private'),
  )

  private dirFor(mentoradoId: string) {
    return resolve(this.privateBase, 'mentorados', mentoradoId, 'audios')
  }

  ensureDir(mentoradoId: string) {
    const dir = this.dirFor(mentoradoId)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    return dir
  }

  /** Monta o payload do arquivo salvo (multer já gravou no disco). */
  savedInfo(mentoradoId: string, file: Express.Multer.File): MentoradoAudioInfo {
    const p = resolve(this.dirFor(mentoradoId), file.filename)
    const st = statSync(p)
    return {
      filename: file.filename,
      mime: file.mimetype || (mime.lookup(p) as string) || 'application/octet-stream',
      size: st.size,
      url: `/mentorados/${mentoradoId}/audios/${encodeURIComponent(file.filename)}`,
      savedAt: new Date(st.mtimeMs).toISOString(),
    }
  }

  list(mentoradoId: string): MentoradoAudioInfo[] {
    const dir = this.dirFor(mentoradoId)
    if (!existsSync(dir)) return []
    const files = readdirSync(dir)
      .filter((f) => statSync(join(dir, f)).isFile())
      .sort((a, b) => statSync(join(dir, b)).mtimeMs - statSync(join(dir, a)).mtimeMs)
    return files.map((f) => {
      const fp = join(dir, f)
      const st = statSync(fp)
      return {
        filename: f,
        mime: (mime.lookup(fp) as string) || 'application/octet-stream',
        size: st.size,
        url: `/mentorados/${mentoradoId}/audios/${encodeURIComponent(f)}`,
        savedAt: new Date(st.mtimeMs).toISOString(),
      }
    })
  }

  /** Stream com suporte a Range. */
  stream(mentoradoId: string, filename: string, req: Request, res: Response) {
    const fp = resolve(this.dirFor(mentoradoId), filename)
    if (!fp.startsWith(this.privateBase) || !existsSync(fp) || !statSync(fp).isFile()) {
      throw new NotFoundException('Áudio não encontrado')
    }

    const st = statSync(fp)
    const type = (mime.lookup(fp) || 'application/octet-stream') as string
    res.setHeader('Content-Type', type)

    const range = req.headers.range
    if (range) {
      const [s, e] = range.replace(/bytes=/, '').split('-')
      let start = parseInt(s, 10)
      let end = e ? parseInt(e, 10) : st.size - 1
      if (Number.isNaN(start)) start = 0
      if (Number.isNaN(end) || end > st.size - 1) end = st.size - 1

      res.status(206)
      res.setHeader('Content-Range', `bytes ${start}-${end}/${st.size}`)
      res.setHeader('Accept-Ranges', 'bytes')
      res.setHeader('Content-Length', String(end - start + 1))
      return createReadStream(fp, { start, end }).pipe(res)
    }

    res.setHeader('Content-Length', String(st.size))
    return createReadStream(fp).pipe(res)
  }
}
