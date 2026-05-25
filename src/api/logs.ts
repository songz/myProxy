import express from 'express'
import fs from 'fs'
import path from 'path'
import environment from '../helpers/environment'
import { rotateLogFile } from '../helpers/logRotation'

const logsRouter = express.Router()
const { LOGPATH } = environment

// Accept both canonical (stdout/stderr) and pm2-native (out/error) names.
const VALID_STREAMS = ['stdout', 'stderr', 'out', 'error']

const streamToFileSuffix = (stream: string): string =>
  stream === 'stdout' || stream === 'out' ? 'out' : 'error'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 100
const MAX_LIMIT = 1000

logsRouter.get('/:stream/:domain', (req, res) => {
  const { stream, domain } = req.params

  if (!VALID_STREAMS.includes(stream)) {
    return res.status(400).json({
      error: `Invalid stream "${stream}". Valid values: ${VALID_STREAMS.join(
        ', '
      )}`
    })
  }

  const page = Math.max(
    1,
    parseInt(req.query.page as string, 10) || DEFAULT_PAGE
  )
  const limit = Math.max(
    1,
    Math.min(
      MAX_LIMIT,
      parseInt(req.query.limit as string, 10) || DEFAULT_LIMIT
    )
  )

  const suffix = streamToFileSuffix(stream)
  const logFile = path.resolve(LOGPATH, `${domain}-${suffix}.log`)

  // Rotate before reading so the current file stays within the size limit.
  rotateLogFile(logFile)

  let lines: string[] = []
  try {
    const content = fs.readFileSync(logFile, 'utf8')
    lines = content.split('\n').filter(l => l.length > 0)
  } catch {
    // File does not exist yet — return empty log rather than an error.
  }

  const totalLines = lines.length
  const totalPages = Math.max(1, Math.ceil(totalLines / limit))
  const start = (page - 1) * limit
  const pageLines = lines.slice(start, start + limit)

  return res.json({
    domain,
    stream,
    page,
    limit,
    totalLines,
    totalPages,
    lines: pageLines
  })
})

export default logsRouter
