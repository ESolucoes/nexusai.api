import {
  Controller, Get, Param, Req, Res, NotFoundException,
} from '@nestjs/common'
import { createReadStream, existsSync, statSync } from 'fs'
import { basename, join, resolve } from 'path'
import type { Request, Response } from 'express'
import * as mime from 'mime-types'
import contentDisposition from 'content-disposition'

@Controller('uploads')
export class UploadsController {
  private readonly baseDir = resolve(
    process.env.UPLOADS_PRIVATE_DIR ?? join(process.cwd(), 'uploads', 'private'),
  )

  // Ex.: /uploads/private/files/curriculum/<arquivo>.pdf
  //      /uploads/private/mentorados/<id>/audios/<arquivo>.webm
  @Get('private/*')
  servePrivate(@Param() params: { 0: string }, @Req() req: Request, @Res() res: Response) {
    const rel = params['0'] || ''
    const filePath = resolve(this.baseDir, rel)

    if (!filePath.startsWith(this.baseDir) || !existsSync(filePath) || !statSync(filePath).isFile()) {
      throw new NotFoundException()
    }

    const stat = statSync(filePath)
    const mimeType = (mime.lookup(filePath) || 'application/octet-stream') as string
    res.setHeader('Content-Type', mimeType)

    // força download para arquivos de currículo
    if (/[/\\]files[/\\]curriculum[/\\]/i.test(filePath)) {
      const fn = basename(filePath)
      res.setHeader('Content-Disposition', contentDisposition(fn, { type: 'attachment' }))
    }

    const range = req.headers.range
    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-')
      let start = parseInt(startStr, 10)
      let end = endStr ? parseInt(endStr, 10) : stat.size - 1
      if (Number.isNaN(start)) start = 0
      if (Number.isNaN(end) || end > stat.size - 1) end = stat.size - 1

      res.status(206)
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`)
      res.setHeader('Accept-Ranges', 'bytes')
      res.setHeader('Content-Length', String(end - start + 1))
      return createReadStream(filePath, { start, end }).pipe(res)
    }

    res.setHeader('Content-Length', String(stat.size))
    return createReadStream(filePath).pipe(res)
  }
}
