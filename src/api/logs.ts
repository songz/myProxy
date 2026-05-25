import express from 'express'
import environment from '../helpers/environment'
import path from 'path'

const logsRouter = express.Router()
const { LOGPATH, isProduction } = environment

logsRouter.get('/:stream/:domain', async (req, res) => {
  const { stream, domain } = req.params

  if (stream !== 'stdout' && stream !== 'stderr') {
    return res
      .status(400)
      .json({ message: 'stream param must be stdout or stderr' })
  }

  if (!isProduction()) {
    return res.send('OK')
  }

  return res.sendFile(path.resolve(LOGPATH, `${domain}-${stream}.log`))
})

export default logsRouter
