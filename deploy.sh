#!/bin/bash
# Load PATH environment variable for Cron execution
export PATH=/home/ubuntu/.nvm/versions/node/v22.22.3/bin:/home/ubuntu/.nvm/versions/node/v20.20.2/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# 1. Masuk ke folder project
cd /home/ubuntu/indorcm-icofr-lifecycle-platform

# 2. Ambil metadata terbaru dari Git remote
git fetch origin main

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse @{u})

# Cek apakah ada commit baru di remote
if [ "$LOCAL" != "$REMOTE" ]; then
    echo "$(date): [CI/CD] Deteksi perubahan baru di remote repo. Memulai update..."
    
    # Tarik kode terbaru
    git pull origin main
    
    # Install dependencies baru jika ada
    bun install
    
    # Jalankan migrasi database
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    bunx drizzle-kit push --force
    
    # Build ulang frontend untuk Apache
    bun run build
    
    # Reload server backend di PM2
    /home/ubuntu/.nvm/versions/node/v20.20.2/bin/pm2 reload icofr-backend
    
    echo "$(date): [CI/CD] Deployment sukses dan server telah di-reload!"
else
    echo "$(date): [CI/CD] Kode sudah up-to-date."
fi
