/* eslint @typescript-eslint/camelcase: 0 */
import express from 'express'
import util from 'util'
import cp from 'child_process'
import {
  setData,
  getMappings,
  getMappingByDomain,
  getMappingById,
  deleteDomain,
  updateDomain
} from '../lib/data'
import { Mapping } from '../types/general'
import environment from '../helpers/environment'

const mappingRouter = express.Router()
const getNextPort = (map, start = 3002): number => {
  if (!map[start]) return start
  if (map[start]) start += 1
  return getNextPort(map, start)
}

mappingRouter.post('/', async (req, res) => {
  const domainKeys = getMappings()
  if (parseInt(req.body.port) < 3001) {
    return res.status(400).json({ message: 'Port cannot be smaller than 3001' })
  }
  const fullDomain = req.body.subDomain
    ? `${req.body.subDomain}.${req.body.domain}`.toLowerCase()
    : `${req.body.domain}`.toLowerCase()
  const existingSubDomain = getMappingByDomain(fullDomain)
  if (existingSubDomain)
    return res.status(400).json({
      message: 'Subdomain already exists'
    })
  const map = domainKeys.reduce((acc, e) => {
    acc[e.port] = true
    return acc
  }, {})
  const portCounter = getNextPort(map)
  const port = parseInt(req.body.port || portCounter, 10)

  const respond = (): void => {
    const mappingObject: Mapping = {
      domain: req.body.domain.toLowerCase(),
      subDomain: req.body.subDomain.toLowerCase(),
      port: port.toString(),
      ip: req.body.ip || '127.0.0.1',
      id: fullDomain,
      description: `${req.body.description || null}`,
      fullDomain
    }
    domainKeys.push(mappingObject)
    setData('mappings', domainKeys)
    res.json(mappingObject)
  }

  return respond()
})

mappingRouter.get('/', async (req, res) => {
  const domains = getMappings()

  return res.json(domains.map(el => ({ ...el, status: 'not started' })))
})

mappingRouter.delete('/:id', async (req, res) => {
  const deletedDomain = getMappingById(req.params.id)
  deleteDomain(deletedDomain.fullDomain)
  return res.json(deletedDomain)
})

mappingRouter.get('/:id', (req, res) => {
  const foundDomain = getMappingById(req.params.id)
  res.json(foundDomain || {})
})

export default mappingRouter
