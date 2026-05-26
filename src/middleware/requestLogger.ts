import fs from 'fs'
import path from 'path'
import { IncomingMessage, ServerResponse } from 'http'
import environment from '../helpers/environment'

const { LOGPATH } = environment

let logDirEnsured = false
function ensureLogDir(): void {
  if (!logDirEnsured) {
    fs.mkdirSync(LOGPATH, { recursive: true })
    logDirEnsured = true
  }
}

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) return (forwarded as string).split(',')[0].trim()
  if (req.socket && req.socket.remoteAddress) return req.socket.remoteAddress
  return '-'
}

export function logProxyRequest(
  req: IncomingMessage,
  res: ServerResponse
): void {
  const startTime = Date.now()
  const host = req.headers.host || 'unknown'
  const method = req.method || '-'
  const url = req.url || '/'
  const ip = getClientIp(req)

  res.on('finish', () => {
    const duration = Date.now() - startTime
    const status = res.statusCode
    const timestamp = new Date().toISOString()
    const domain = host.split(':')[0]
    const line = `${timestamp} ${method} ${host}${url} ${status} ${duration}ms ${ip}\n`

    try {
      ensureLogDir()
      const logFile = path.resolve(LOGPATH, `${domain}-access.log`)
      fs.appendFile(logFile, line, err => {
        if (err) console.error('Access log write error', err.message)
      })
    } catch (err) {
      console.error('Access log setup error', (err as Error).message)
    }
  })
}
