import express from 'express'
import environment from '../helpers/environment'
import path from 'path'

const logsRouter = express.Router()
const { LOGPATH } = environment

logsRouter.get('/:stream/:domain', async (req, res) => {
  const { stream, domain } = req.params

  return res.sendFile(path.resolve(LOGPATH, `${domain}-${stream}.log`))
})

export default logsRouter
