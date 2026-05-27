import fs from 'fs'
import path from 'path'
import os from 'os'
import { collectTlsInfo, logTlsConnection } from '../../middleware/tlsLogger'
import environment from '../../helpers/environment'

type FakeSocket = {
  remoteAddress?: string
  remotePort?: number
  servername?: string
  authorized?: boolean
  alpnProtocol?: string | false
  getCipher?: () => { name: string; version: string } | undefined
  getProtocol?: () => string | null
}

function makeFakeSocket(overrides: Partial<FakeSocket> = {}): FakeSocket {
  return {
    remoteAddress: '203.0.113.7',
    remotePort: 49152,
    servername: 'example.com',
    authorized: true,
    alpnProtocol: 'h2',
    getCipher: (): { name: string; version: string } => ({
      name: 'TLS_AES_256_GCM_SHA384',
      version: 'TLSv1.3'
    }),
    getProtocol: (): string => 'TLSv1.3',
    ...overrides
  }
}

describe('tlsLogger.collectTlsInfo', () => {
  it('extracts ip, sni, protocol, cipher, and alpn from the socket', () => {
    const info = collectTlsInfo(makeFakeSocket() as never)
    expect(info.ip).toBe('203.0.113.7')
    expect(info.port).toBe(49152)
    expect(info.servername).toBe('example.com')
    expect(info.protocol).toBe('TLSv1.3')
    expect(info.cipher).toBe('TLS_AES_256_GCM_SHA384')
    expect(info.cipherVersion).toBe('TLSv1.3')
    expect(info.alpnProtocol).toBe('h2')
    expect(info.authorized).toBe(true)
    expect(typeof info.timestamp).toBe('string')
  })

  it('falls back to dashes when fields are missing', () => {
    const socket = makeFakeSocket({
      remoteAddress: undefined,
      servername: undefined,
      alpnProtocol: false,
      getCipher: () => undefined,
      getProtocol: () => null
    })
    const info = collectTlsInfo(socket as never)
    expect(info.ip).toBe('-')
    expect(info.servername).toBe('-')
    expect(info.protocol).toBe('-')
    expect(info.cipher).toBe('-')
    expect(info.cipherVersion).toBe('-')
    expect(info.alpnProtocol).toBe('-')
  })
})

describe('tlsLogger.logTlsConnection', () => {
  const originalLogPath = environment.LOGPATH
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tls-log-test-'))
    environment.LOGPATH = tmpDir
  })

  afterEach(() => {
    environment.LOGPATH = originalLogPath
    try {
      for (const f of fs.readdirSync(tmpDir)) {
        fs.unlinkSync(path.join(tmpDir, f))
      }
      fs.rmdirSync(tmpDir)
    } catch (_) {
      // best effort cleanup
    }
  })

  it('writes a line to <servername>-tls.log', done => {
    logTlsConnection(makeFakeSocket() as never)
    setTimeout(() => {
      const file = path.join(tmpDir, 'example.com-tls.log')
      expect(fs.existsSync(file)).toBe(true)
      const contents = fs.readFileSync(file, 'utf8')
      expect(contents).toContain('ip=203.0.113.7')
      expect(contents).toContain('sni=example.com')
      expect(contents).toContain('protocol=TLSv1.3')
      expect(contents).toContain('cipher=TLS_AES_256_GCM_SHA384')
      expect(contents).toContain('alpn=h2')
      done()
    }, 100)
  })

  it('writes to unknown-tls.log when sni is missing', done => {
    logTlsConnection(makeFakeSocket({ servername: undefined }) as never)
    setTimeout(() => {
      const file = path.join(tmpDir, 'unknown-tls.log')
      expect(fs.existsSync(file)).toBe(true)
      done()
    }, 100)
  })
})
