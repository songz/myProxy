import fs from 'fs'
import path from 'path'
import environment from './environment'

const MAX_LOG_SIZE = environment.MAX_LOG_SIZE
const MAX_LOG_FILES = environment.MAX_LOG_FILES

// Rotate a single log file when it exceeds MAX_LOG_SIZE bytes.
// Keeps up to MAX_LOG_FILES rotated copies (.log.1 … .log.N); oldest is deleted.
const rotateLogFile = (filePath: string): void => {
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
  } catch {
    // Ignore errors — rotation is best-effort
  }
}

// Rotate all *.log files in LOGPATH. Called on startup and periodically.
const rotateAllLogs = (): void => {
  const { LOGPATH } = environment
  try {
    const files = fs.readdirSync(LOGPATH).filter(f => /\.log$/.test(f))
    files.forEach(f => rotateLogFile(path.resolve(LOGPATH, f)))
  } catch {
    // LOGPATH may not exist in dev/test environments
  }
}

export { rotateLogFile, rotateAllLogs, MAX_LOG_SIZE, MAX_LOG_FILES }
