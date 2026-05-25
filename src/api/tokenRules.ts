import express, { Response, NextFunction } from 'express'
import uuidv4 from 'uuid/v4'
import { TokenRule, AuthenticatedRequest } from '../types/general'
import { setData, getTokenRules, getAccessTokens } from '../lib/data'

const tokenRulesRouter = express.Router()

tokenRulesRouter.use(
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user.isAdmin) {
      res.status(401).send('Unauthorized')
      return
    }
    return next()
  }
)

tokenRulesRouter.get('/', (req, res) => {
  res.json(getTokenRules())
})

tokenRulesRouter.post('/', (req, res) => {
  const { tokenId, fullDomain, path } = req.body
  if (!tokenId || !fullDomain) {
    return res
      .status(400)
      .json({ message: 'tokenId and fullDomain are required' })
  }
  const tokens = getAccessTokens()
  if (!tokens.find(t => t.id === tokenId)) {
    return res.status(400).json({ message: 'Token not found' })
  }
  const rules = getTokenRules()
  const rule: TokenRule = {
    id: uuidv4(),
    tokenId,
    fullDomain: fullDomain.toLowerCase(),
    path: path || '/'
  }
  rules.push(rule)
  setData('tokenRules', rules)
  res.json(rule)
})

tokenRulesRouter.delete('/:id', (req, res) => {
  const rules = getTokenRules()
  const idx = rules.findIndex(r => r.id === req.params.id)
  if (idx === -1) {
    return res.status(404).json({ message: 'Rule not found' })
  }
  const [deleted] = rules.splice(idx, 1)
  setData('tokenRules', rules)
  res.json(deleted)
})

export default tokenRulesRouter
