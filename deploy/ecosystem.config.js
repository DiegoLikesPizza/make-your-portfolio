// pm2 config for the deployed app. Installed at <app>/ecosystem.config.js.
//
// Bound to 127.0.0.1 so only nginx can reach it — /api/caddy/authorize in
// particular must never be publicly reachable.
module.exports = {
  apps: [
    {
      name: "make-your-portfolio",
      script: "/srv/websites/make-your-portfolio.lfdiego.xyz/app/start.sh",
      cwd: "/srv/websites/make-your-portfolio.lfdiego.xyz/app",
      interpreter: "bash",
      env: { NODE_ENV: "production", PORT: 3004, HOSTNAME: "127.0.0.1" },
      max_memory_restart: "512M",
    },
  ],
};
