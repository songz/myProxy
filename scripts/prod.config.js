const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') })

module.exports = {
  apps: [
    {
      name: 'myProxy-prod',
      script: './build/app.js',
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      instances: 1,
      autorestart: false,
      cron_restart: '0 0 1 * *',
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        PORT: process.env.PORT || 3000,
        ADMIN: process.env.ADMIN,
        WORKPATH: process.env.WORKPATH || '/home/myproxy'
      },
    },
  ],
}
