import 'dotenv/config'
import express from 'express'
import https from 'https'
import httpProxy from 'http-proxy'
import path from 'path'
import fs from 'fs'
import cookieParser from 'cookie-parser'
import esbuild from 'esbuild'

import { adminRouter } from '../admin/index'
import { apiRouter } from '../api/index'
import { validUIAccess } from '../helpers/authentication'
import { hashPass } from '../helpers/crypto'
import { getAvailableDomains, getMappingByDomain } from '../lib/data'
import { setPass, setupAuth, isCorrectCredentials } from '../auth'
import { ProxyMapping } from '../types/general'
import { SNICallback } from '../helpers/SNICallback'

// The steps below are covered by the setup script. This is not necessary.
const cyan = '\x1b[36m\u001b[1m%s\x1b[0m'
const red = '\x1b[31m\u001b[1m%s\x1b[0m'
const errorMsg =
  'ERROR: App cannot be started because you must set an ADMIN password in the environment variable when running this app. Visit https://github.com/garageScript/myproxy#how-to-install'

const startAppServer = (
  port: string | number,
  adminPass: string
): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    if (!adminPass) {
      console.error(red, errorMsg)
      return reject(errorMsg)
    }
    setPass(adminPass)

    const app = express()
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(cookieParser())
    app.use(express.static(path.join(__dirname, '../public')))
    app.use(setupAuth)
    app.use('/admin', adminRouter)
    app.use('/api', apiRouter)
    app.set('view engine', 'ejs')
    app.set('views', path.join(__dirname, '../../views'))

    app.get('/', validUIAccess, (_, res) => {
      getAvailableDomains().length > 0
        ? res.render('client')
        : res.redirect('/admin')
    })
    app.get('/login', (req, res) => res.render('login', { error: '' }))

    app.post('/login', (req, res) => {
      if (isCorrectCredentials(req.body.adminPass, adminPass)) {
        res.cookie('adminPass', hashPass(adminPass), { httpOnly: true })
        return res.redirect('/admin')
      }

      return res.render('login', { error: 'Wrong Admin Password' })
    })

    const server = app.listen(port, () => {
      console.log(cyan, `myProxy is running on port ${port}!`)
      resolve(server)
    })
  })
}

const startProxyServer = (): void => {
  const proxy = httpProxy.createProxyServer({ xfwd: true })
  proxy.on('error', (err, _req, resOrSocket) => {
    console.error('Proxy error', err.message)
    if (!resOrSocket) return
    if ('writeHead' in resOrSocket) {
      if (!resOrSocket.headersSent) resOrSocket.writeHead(502)
      resOrSocket.end('Bad Gateway')
    } else {
      resOrSocket.destroy()
    }
  })

  const server = https.createServer({ SNICallback }, (req, res) => {
    req.on('error', err =>
      console.error('Request error', req.headers.host, err.message)
    )
    res.on('error', err =>
      console.error('Response error', req.headers.host, err.message)
    )
    try {
      const { ip, port }: ProxyMapping =
        getMappingByDomain(req.headers.host) || {}
      if (!port || !ip) return res.end('Not Found')
      proxy.web(
        req,
        res,
        {
          target: `http://${ip}:${port}`,
          xfwd: true,
          preserveHeaderKeyCase: true
        },
        err => {
          console.error('Error communicating with server', err.message)
          if (!res.headersSent) res.writeHead(502)
          if (res.writable) res.end('Bad Gateway')
        }
      )
    } catch (err) {
      console.error('Error: proxy failed', err)
      if (res.writable)
        res.end(`Error: failed to create proxy ${req.headers.host}`)
    }
  })

  server.on('clientError', (err, socket) => {
    console.error('Client error', err.message)
    if (socket.writable) {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
    } else {
      socket.destroy()
    }
  })

  server.on('upgrade', function(req, socket, head) {
    socket.on('error', err =>
      console.error('Upgrade socket error', req.headers.host, err.message)
    )
    const { ip, port }: ProxyMapping =
      getMappingByDomain(req.headers.host) || {}
    if (!port) return socket.destroy()
    proxy.ws(req, socket, head, { target: `http://${ip}:${port}` })
  })
  server.on('error', err => console.error('HTTPS server error', err.message))
  server.listen(443)
  const httpApp = express()
  httpApp.get('/*', (req, res) => {
    const paramCheck = req.headers.host.split('?')[1]
    const params = paramCheck ? `?${paramCheck}` : ''
    res.redirect(`https://${req.headers.host}${req.path}${params}`)
  })
  httpApp.listen(80)
}

const watchClientFiles = async (): Promise<void> => {
  const srcDir = path.join(__dirname, '../../src/public')
  const outDir = path.join(__dirname, '../public')
  if (!fs.existsSync(srcDir)) return

  const entryPoints = fs
    .readdirSync(srcDir)
    .filter(f => f.endsWith('.ts') || f.endsWith('.jsx'))
    .map(f => path.join(srcDir, f))

  if (entryPoints.length === 0) return

  const ctx = await esbuild.context({
    entryPoints,
    bundle: false,
    outdir: outDir,
    loader: { '.jsx': 'jsx' }
  })

  await ctx.rebuild()
  await ctx.watch()
  console.log(cyan, 'Watching client files for changes...')
}

watchClientFiles().catch(err => console.error('esbuild watch error:', err))

export { startProxyServer, startAppServer }
