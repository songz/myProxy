export default {
  ENV: process.env.NODE_ENV || process.env.ENV || 'development',
  PORT: process.env.PORT || process.env.ENV || 3000,
  ADMIN_PASS: process.env.ADMIN || process.env.ENV || null,
  HOME: process.env.HOME || process.env.ENV || null,
  WORKPATH: process.env.WORKPATH || '/home/myproxy',
  LOGPATH: process.env.LOGPATH || '/home/myproxy/logs',
  MAX_LOG_SIZE:
    parseInt(process.env.MAX_LOG_SIZE || '', 10) || 10 * 1024 * 1024, // 10 MB
  MAX_LOG_FILES: parseInt(process.env.MAX_LOG_FILES || '', 10) || 5,
  isProduction: (): boolean =>
    (process.env.NODE_ENV || process.env.ENV) === 'production'
}
