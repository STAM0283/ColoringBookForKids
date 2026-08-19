module.exports = {
  apps: [{
    name: "lepetitcrayon",
    script: "node_modules/next/dist/bin/next",
    args: "start",
    cwd: "/var/www/lepetitcrayon/current",
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    max_memory_restart: "700M",
    kill_timeout: 10_000,
    listen_timeout: 10_000,
    env: {
      NODE_ENV: "production",
      APP_ENV: "production",
      HOSTNAME: "127.0.0.1",
      PORT: "3000",
    },
    error_file: "/var/log/pm2/lepetitcrayon-error.log",
    out_file: "/var/log/pm2/lepetitcrayon-out.log",
    merge_logs: true,
    time: true,
  }],
};
