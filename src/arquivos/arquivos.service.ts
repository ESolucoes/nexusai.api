import { Injectable } from '@nestjs/common'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

@Injectable()
export class ArquivosService {
  getPublicRootDir() {
    return process.env.UPLOADS_PUBLIC_DIR || './uploads/public'
  }

  getPrivateRootDir() {
    return process.env.UPLOADS_PRIVATE_DIR || './uploads/private'
  }

  getPublicBaseUrl() {
    return (process.env.APP_PUBLIC_URL || 'http://localhost:3000').replace(/\/+$/, '')
  }

  ensureDir(relativePath: string) {
    const full = join(this.getPublicRootDir(), relativePath)
    if (!existsSync(full)) mkdirSync(full, { recursive: true })
    return full
  }

  ensurePrivateDir(relativePath: string) {
    const full = join(this.getPrivateRootDir(), relativePath)
    if (!existsSync(full)) mkdirSync(full, { recursive: true })
    return full
  }

  buildStorageKey(relativePath: string, filename: string) {
    return `${relativePath}/${filename}`.replace(/\\/g, '/')
  }

  buildPublicUrl(storageKey: string) {
    const key = storageKey.startsWith('uploads/') ? storageKey : `uploads/${storageKey}`
    return `${this.getPublicBaseUrl()}/${key}`.replace(/\\/g, '/')
  }

  buildPrivateUrl(storageKey: string) {
    const key = storageKey.startsWith('uploads/') ? storageKey : `uploads/${storageKey}`
    return `${this.getPublicBaseUrl()}/${key}`.replace(/\\/g, '/')
  }
}
