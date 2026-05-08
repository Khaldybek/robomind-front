/**
 * PM2: production Next.js на порту 3011.
 *
 * Перед первым запуском: npm ci && npm run build
 * Запуск: pm2 start ecosystem.config.cjs
 * Логи: pm2 logs robomind-front
 */
module.exports = {
  apps: [
    {
      name: "robomind-front",
      cwd: __dirname,
      script: "npm",
      args: "run start",
      interpreter: "none",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 15,
      min_uptime: "10s",
      env: {
        NODE_ENV: "production",
        PORT: "3011",
      },
    },
  ],
};
