#!/bin/bash
# IndoGRC Pro - hardened deployment script (SK-5/DKU.MBU/11/2024 auditability)
# Fail fast on undefined vars, propagate pipe failures. Git/build steps handled explicitly.
set -uo pipefail

# 0. PATH hardening: cron & non-interactive SSH often have minimal PATH.
#    Bun lives under nvm on this host; also support $HOME/.bun installs.
export PATH="/home/ubuntu/.nvm/versions/node/v22.22.3/bin:/home/ubuntu/.nvm/versions/node/v20.20.2/bin:/home/ubuntu/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"

# 1. Masuk ke folder project (fail fast if missing)
cd /home/ubuntu/indorcm-icofr-lifecycle-platform || { echo "$(date): [CI/CD] FATAL: project dir missing"; exit 1; }

# 2. Ambil metadata terbaru dari remote (update origin/main tracking ref)
if ! git fetch origin main 2>&1; then
    echo "$(date): [CI/CD] FATAL: git fetch gagal (cek token/akses GitHub remote)"
    exit 1
fi
# FETCH_HEAD-only fetch doesn't always move origin/main; ensure tracking ref is fresh
git update-ref refs/remotes/origin/main FETCH_HEAD 2>/dev/null || true

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

# Cek apakah ada commit baru di remote
if [ "$LOCAL" != "$REMOTE" ]; then
    echo "$(date): [CI/CD] Deteksi perubahan baru ($LOCAL -> $REMOTE). Memulai update..."

    # 3. Dirty-tree safe: bun install sering mengotori bun.lock -> git pull akan abort
    #    ("Your local changes ... would be overwritten"). Stash otomatis agar pull tidak gagal.
    STASHED=0
    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo "$(date): [CI/CD] Working tree kotor, auto-stash sebelum pull:"
        git status --short
        if git stash push -m "ci-auto-stash $(date -Is)" --keep-index; then
            STASHED=1
        else
            echo "$(date): [CI/CD] FATAL: git stash gagal"
            exit 1
        fi
    fi

    # Tarik kode terbaru (fast-forward only; server must mirror remote)
    if ! git pull --ff-only origin main; then
        echo "$(date): [CI/CD] FATAL: git pull --ff-only gagal"
        [ "$STASHED" = "1" ] && git stash pop || true
        exit 1
    fi
    # Stash auto hanya berisi artefak generated (mis. bun.lock) yg kini sudah sama
    # dengan remote -> drop agar tidak menumpuk. Jika pop konflik, biarkan untuk inspeksi manual.
    if [ "$STASHED" = "1" ]; then
        if git stash show -p stash@{0} -- bun.lock >/dev/null 2>&1 && git diff --quiet origin/main -- bun.lock; then
            git stash drop || true
        else
            git stash pop || echo "$(date): [CI/CD] WARN: stash pop konflik, perlu inspeksi manual (git stash list)"
        fi
    fi

    # 4. Pastikan bun tersedia dengan pesan yang jelas (dulu: "bun: command not found" lalu false-sukses)
    if ! command -v bun >/dev/null 2>&1; then
        echo "$(date): [CI/CD] FATAL: bun tidak ditemukan di PATH=$PATH"
        exit 1
    fi

    # Install dependencies baru jika ada (fail fast)
    bun install || { echo "$(date): [CI/CD] FATAL: bun install gagal"; exit 1; }

    # Jalankan migrasi database
    if [ -f .env ]; then
        set -a; . ./.env; set +a
    fi
    bunx drizzle-kit push --force || { echo "$(date): [CI/CD] FATAL: drizzle push gagal"; exit 1; }

    # Build ulang frontend untuk Apache (fail fast)
    bun run build || { echo "$(date): [CI/CD] FATAL: bun run build gagal"; exit 1; }

    # Reload server backend di PM2 (gunakan pm2 dari PATH, fallback ke path absolut lama)
    PM2_BIN="$(command -v pm2 || echo /home/ubuntu/.nvm/versions/node/v20.20.2/bin/pm2)"
    "$PM2_BIN" reload icofr-backend || { echo "$(date): [CI/CD] FATAL: pm2 reload gagal"; exit 1; }

    echo "$(date): [CI/CD] Deployment sukses dan server telah di-reload!"
else
    echo "$(date): [CI/CD] Kode sudah up-to-date."
fi
