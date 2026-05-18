import { startAppServer, startProxyServer } from './server/server'
import environment from './helpers/environment'

const { PORT, ADMIN_PASS, isProduction } = environment

process.on('uncaughtException', err =>
  console.error('uncaughtException', err)
)
process.on('unhandledRejection', reason =>
  console.error('unhandledRejection', reason)
)

startAppServer(PORT, ADMIN_PASS).catch(error =>
  console.error(`startAppServer: ${error}`)
)

/**
 * Proxy Server will create SSL Certificates on the server
 * for your domains in production.
 * Development mode do not have to run the proxy server.
 * */
if (isProduction()) startProxyServer()
