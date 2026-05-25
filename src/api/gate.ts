import express from 'express'
import {
  getBlacklistedIPs,
  addBlacklistedIP,
  removeBlacklistedIP
} from '../lib/data'

const gateRouter = express.Router()

gateRouter.get('/blacklist', (_req, res) => {
  res.json(getBlacklistedIPs())
})

gateRouter.post('/blacklist', (req, res) => {
  const { ip } = req.body
  if (!ip || typeof ip !== 'string') {
    return res.status(400).json({ message: 'ip is required' })
  }
  addBlacklistedIP(ip.trim())
  res.json({ ip: ip.trim() })
})

gateRouter.delete('/blacklist/:ip', (req, res) => {
  const ip = decodeURIComponent(req.params.ip)
  removeBlacklistedIP(ip)
  res.json({ ip })
})

export default gateRouter
