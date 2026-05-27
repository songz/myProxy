import fs from 'fs'
import path from 'path'
import { TLSSocket } from 'tls'
import environment from '../helpers/environment'

let ensuredLogDir: string | null = null
function ensureLogDir(): string {
  const logPath = environment.LOGPATH
  if (ensuredLogDir !== logPath) {
    fs.mkdirSync(logPath, { recursive: true })
    ensuredLogDir = logPath
  }
  return logPath
}

function getClientIp(socket: TLSSocket): string {
  if (socket.remoteAddress) return socket.remoteAddress
  return '-'
}

export interface TlsConnectionInfo {
  timestamp: string
  ip: string
  port: number | string
  servername: string
  protocol: string
  cipher: string
  cipherVersion: string
  alpnProtocol: string
  authorized: boolean
}

export function collectTlsInfo(socket: TLSSocket): TlsConnectionInfo {
  const cipher = socket.getCipher && socket.getCipher()
  return {
    timestamp: new Date().toISOString(),
    ip: getClientIp(socket),
    port: socket.remotePort || '-',
    servername:
      (socket as TLSSocket & { servername?: string }).servername || '-',
    protocol: socket.getProtocol ? socket.getProtocol() || '-' : '-',
    cipher: cipher ? cipher.name : '-',
    cipherVersion: cipher ? cipher.version : '-',
    alpnProtocol:
      typeof socket.alpnProtocol === 'string' && socket.alpnProtocol
        ? socket.alpnProtocol
        : '-',
    authorized: socket.authorized
  }
}

export function logTlsConnection(socket: TLSSocket): void {
  let info: TlsConnectionInfo
  try {
    info = collectTlsInfo(socket)
  } catch (err) {
    console.error('TLS log collect error', (err as Error).message)
    return
  }

  const domain =
    info.servername && info.servername !== '-' ? info.servername : 'unknown'
  const line =
    `${info.timestamp} ip=${info.ip} port=${info.port} ` +
    `sni=${info.servername} protocol=${info.protocol} ` +
    `cipher=${info.cipher} cipherVersion=${info.cipherVersion} ` +
    `alpn=${info.alpnProtocol} authorized=${info.authorized}\n`

  try {
    const logPath = ensureLogDir()
    const logFile = path.resolve(logPath, `${domain}-tls.log`)
    fs.appendFile(logFile, line, err => {
      if (err) console.error('TLS log write error', err.message)
    })
  } catch (err) {
    console.error('TLS log setup error', (err as Error).message)
  }
}
