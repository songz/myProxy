// escape characters required or readFileSync will not find file
/* eslint-disable */
import fs from 'fs'
import tls from 'tls'
import util from 'util'

import environment from '../helpers/environment'

const { HOME } = environment
const acmePath = `${HOME}/.acme.sh`
const readFileAsync = util.promisify(fs.readFile)
const keyCache: { [key: string]: string } = {}
const certCache: { [key: string]: string } = {}

const readFile = async (path: string) => {
  const data = await readFileAsync(path, 'utf8')
  return data || null
}

const isIPAddress = (host: string): boolean => /^\d+\.\d+\.\d+\.\d+$/.test(host)

const SNICallback = async (host, cb) => {
  try {
    if (!host || isIPAddress(host)) {
      const err = new Error(`SNI: no cert for ${host}`)
      if (cb) return cb(err, null)
      throw err
    }

    // TLD -> Top-Level Domain | SLD -> Second-Level Domain
    const [TLD, SLD, ...subDomains] = host.split('.').reverse()
    if (!SLD || !TLD) {
      const err = new Error(`SNI: invalid host ${host}`)
      if (cb) return cb(err, null)
      throw err
    }
    const domain = `${SLD}.${TLD}`
    const wildstar = subDomains.length > 0 ? '*.' : ''
    const key = `${acmePath}${wildstar}${domain}`
    const keyPath = `${acmePath}/${wildstar}${domain}/${wildstar}${domain}\.key`
    const certPath = `${acmePath}/${wildstar}${domain}/fullchain.cer`
    if (!keyCache[key]) keyCache[key] = await readFile(keyPath)
    if (!certCache[key]) certCache[key] = await readFile(certPath)
    if (!keyCache[key] || !certCache[key]) {
      const err = new Error(`SNI: cert/key not found for ${host}`)
      if (cb) return cb(err, null)
      throw err
    }
    const secureContext = tls.createSecureContext({
      key: keyCache[key],
      cert: certCache[key]
    })
    if (cb) return cb(null, secureContext)
    return secureContext
  } catch (err) {
    console.error(`[SNI] Error handling ${host}:`, err.message)
    if (cb) return cb(err, null)
    throw err
  }
}

export { SNICallback }
