#!/usr/bin/env node
'use strict'

/**
 * Log rotation script — intended to be run via cron (installed by setup.sh).
 * Rotates every *.log file in LOGPATH when it exceeds MAX_LOG_SIZE bytes,
 * keeping up to MAX_LOG_FILES rotated copies (.log.1 … .log.N).
 *
 * Environment variables (read from .env if present, then process.env):
 *   LOGPATH       – directory containing log files  (default: /home/myproxy/logs)
 *   MAX_LOG_SIZE  – bytes before rotation            (default: 10485760 = 10 MB)
 *   MAX_LOG_FILES – number of rotated copies to keep (default: 5)
 */

const path = require('path')
const fs = require('fs')

try {
  require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') })
} catch (_) {
  // dotenv is optional; proceed with process.env as-is
}

const LOGPATH = process.env.LOGPATH || '/home/myproxy/logs'
const MAX_LOG_SIZE =
  parseInt(process.env.MAX_LOG_SIZE || '', 10) || 10 * 1024 * 1024
const MAX_LOG_FILES = parseInt(process.env.MAX_LOG_FILES || '', 10) || 5

function rotateLogFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return
    const stat = fs.statSync(filePath)
    if (stat.size < MAX_LOG_SIZE) return

    for (let i = MAX_LOG_FILES - 1; i >= 1; i--) {
      const src = `${filePath}.${i}`
      const dest = `${filePath}.${i + 1}`
      if (fs.existsSync(src)) {
        if (i === MAX_LOG_FILES - 1) {
          fs.unlinkSync(src)
        } else {
          fs.renameSync(src, dest)
        }
      }
    }

    fs.renameSync(filePath, `${filePath}.1`)
    fs.writeFileSync(filePath, '')
  } catch (_) {
    // best-effort — ignore permission errors, race conditions, etc.
  }
}

try {
  const files = fs.readdirSync(LOGPATH).filter(f => /\.log$/.test(f))
  files.forEach(f => rotateLogFile(path.resolve(LOGPATH, f)))
} catch (_) {
  // LOGPATH may not exist in some environments
}
