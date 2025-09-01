// src/common/uploads/agents-message.upload.ts
import type { Options } from 'multer'
import { extname } from 'path'

/** extensões e mimetypes aceitos (imagens + documentos) */
const ALLOWED_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg',
  '.pdf', '.doc', '.docx', '.odt', '.rtf', '.txt',
  '.csv', '.xls', '.xlsx', '.ppt', '.pptx', '.json'
])

const ALLOWED_MIME = new Set([
  // imagens
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml',
  // documentos
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  'application/rtf', 'text/rtf',
  'text/plain',
  'text/csv', 'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/json'
])

export const agentsMessageMulterOptions: Options = {
  // se você já usa storage próprio, remova esta linha
  // storage: memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB por arquivo (ajuste se precisar)
    files: 10,
  },
  fileFilter: (_req, file, cb) => {
    const okByMime = ALLOWED_MIME.has(String(file.mimetype).toLowerCase())
    const okByExt = ALLOWED_EXT.has(extname(file.originalname).toLowerCase())
    if (okByMime || okByExt) return cb(null, true)
    cb(new Error('Tipo de arquivo não permitido. Envie imagens ou documentos (pdf, docx, xlsx, pptx, etc).'))
  },
}
