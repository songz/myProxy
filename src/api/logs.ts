import express from 'express'
import environment from '../helpers/environment'
import path from 'path'
import fs from 'fs'

const logsRouter = express.Router()
const { LOGPATH } = environment
const VALID_STREAMS = ['stdout', 'stderr', 'access']

logsRouter.get('/:stream/:domain', async (req, res) => {
  const { stream, domain } = req.params

  if (!VALID_STREAMS.includes(stream)) {
    return res.status(400).send('Invalid stream parameter')
  }

  const logFile = path.resolve(LOGPATH, `${domain}-${stream}.log`)

  if (!fs.existsSync(logFile)) {
    return res.status(200).send('')
  }

  return res.sendFile(logFile)
})

export default logsRouter
