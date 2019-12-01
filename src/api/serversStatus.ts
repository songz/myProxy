import cp from 'child_process'
import express from 'express'
import environment from '../helpers/environment'
import util from 'util'

const statusRouter = express.Router()
const exec = util.promisify(cp.exec)
const { isProduction } = environment

statusRouter.get('/', async (req, res) => {
  try {
    if (isProduction()) {
      const data = await exec('su - myproxy -c "pm2 jlist"')
      res.json(data)
    } else {
      res.json({ stdout: [] })
    }
  } catch (err) {
    res.status(500).send({ err })
  }
})

export default statusRouter
