import { Injectable } from '@nestjs/common';
import { join, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { Request } from 'express';

const stripEndSlashes = (s: string) => s.replace(/\/+$/, '');

@Injectable()
export class ArquivosService {
  getPublicRootDir() {
    const p =
      process.env.UPLOADS_PUBLIC_DIR ||
      join(process.cwd(), 'uploads', 'public');
    return resolve(p);
  }

  getPrivateRootDir() {
    const p =
      process.env.UPLOADS_PRIVATE_DIR ||
      join(process.cwd(), 'uploads', 'private');
    return resolve(p);
  }

  getPublicBaseUrl() {
    const base = process.env.APP_PUBLIC_URL;
    return stripEndSlashes(base ?? '');
  }

  ensureDir(relativePath: string) {
    const full = resolve(this.getPublicRootDir(), relativePath);
    if (!existsSync(full)) mkdirSync(full, { recursive: true });
    return full;
  }

  ensurePrivateDir(relativePath: string) {
    const full = resolve(this.getPrivateRootDir(), relativePath);
    if (!existsSync(full)) mkdirSync(full, { recursive: true });
    return full;
  }

  buildStorageKey(relativePath: string, filename: string) {
    return `${relativePath}/${filename}`
      .replace(/\\/g, '/')
      .replace(/^\/+/, '');
  }

  private absoluteFromReq(req?: Request) {
    const proto =
      (req?.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim() ||
      req?.protocol ||
      'http';
    const host =
      (req?.headers['x-forwarded-host'] as string)?.split(',')[0]?.trim() ||
      req?.get?.('host') ||
      'localhost:3000';
    return `${proto}://${host}`;
  }

  buildPublicUrl(
    storageKey: string,
    opts?: { absolute?: boolean; req?: Request },
  ) {
    const key = storageKey.replace(/^\/+/, '').replace(/\\/g, '/');
    const rel = `/uploads/${key}`;
    if (opts?.absolute) return `${this.absoluteFromReq(opts.req)}${rel}`;
    return rel;
  }

  buildPrivateUrl(
    storageKey: string,
    opts?: { absolute?: boolean; req?: Request },
  ) {
    const key = storageKey.replace(/^\/+/, '').replace(/\\/g, '/');
    const rel = `/uploads/private/${key}`;
    if (opts?.absolute) return `${this.absoluteFromReq(opts.req)}${rel}`;
    return rel;
  }
}