#!/bin/bash
# IndoGRC Pro - production deploy (Regulasi SK-5/DKU.MBU/11/2024: auditabilitas)
#
# Dipicu oleh:
#   1. GitHub Action (.github/workflows/deploy.yml) setiap push ke main, atau
#   2. post-merge hook (scripts/git-hooks/post-merge) setiap `git pull` manual.
#
# Cara pakai:
#   bash deploy.sh            # deploy hanya bila ada commit baru ATAU build basi
#   bash deploy.sh --check    # read-only: status sinkronisasi, tanpa perubahan
#   bash deploy.sh --force    # paksa install + build + reload (tanpa pull)
#
# Prinsip anti-gagal-berulang:
#   1. flock        -> push beruntun antre (menunggu), bukan balapan.
#   2. fetch --prune-> origin/main selalu segar, bukan FETCH_HEAD basi.
#   3. stash-backup -> file tracked yg kotor (mis. bun.lock hasil bun install)
#                      diamankan dulu supaya `git pull` tidak pernah abort.
#                      Stash HANYA di-drop bila isinya identik dgn HEAD baru;
#                      selebihnya DISIMPAN + warning (tidak pernah dibuang diam-diam).
#   4. staleness    -> bila dist lebih tua dari HEAD (mis. push dari server ini
#                      sendiri / pull manual tanpa build), tetap build + reload.
#   5. migrate hemat-> drizzle push hanya bila file skema berubah antar-revisi.
#   6. health gate  -> "sukses" diklaim hanya bila dist segar + pm2 online +
#                      backend HTTP menjawab; selebihnya exit 1 (Action merah).
set -uo pipefail

# Pastikan PATH mencakup Node v22, bun, dan pm2 untuk sesi non-login SSH (GitHub Actions)
export PATH="/home/ubuntu/.nvm/versions/node/v22.22.3/bin:/home/ubuntu/.bun/bin:/usr/local/bin:$PATH"

PROJECT_DIR="/home/ubuntu/indorcm-icofr-lifecycle-platform"
LOCK_FILE="/tmp/icofr-deploy.lock"
LOG_FILE="/tmp/icofr-deploy.log"
BACKEND_URL="http://localhost:3001/api/settings"
DIST_INDEX="dist/client/index.html"
DEPLOY_INFO="dist/client/deploy-info.json"
LIVE_DIR="/var/www/icofr"
LIVE_INDEX="$LIVE_DIR/index.html"
LIVE_DEPLOY_INFO="$LIVE_DIR/deploy-info.json"

MODE="deploy"
for arg in "$@"; do
    case "$arg" in
        --check) MODE="check" ;;
        --force|--rebuild) MODE="force" ;;
        *) echo "Argumen tidak dikenal: $arg (pilihan: --check, --force)"; exit 2 ;;
    esac
done

log() { echo "$(date '+%F %T %Z'): [CI/CD] $*"; }

# Tandai proses deploy aktif agar git hooks (post-merge) tidak memicu deploy rekursif/deadlock
export DEPLOY_IN_PROGRESS=1

# Antre bila ada deploy lain berjalan (maks 15 menit), jgn tumpang tindih.
exec 9>"$LOCK_FILE"
if ! flock -w 900 9; then
    log "FATAL: deploy lain masih berjalan >15 menit ($LOCK_FILE terkunci)"
    exit 1
fi

# Mirror log ke file di luar repo (agar tidak mengotori git tree) + stdout utk Action.
exec > >(tee -a "$LOG_FILE") 2>&1

cd "$PROJECT_DIR" || { log "FATAL: project dir hilang: $PROJECT_DIR"; exit 1; }

if ! git fetch origin --prune 2>&1; then
    log "FATAL: git fetch gagal (cek akses GitHub remote; bila memakai PAT, pastikan belum kedaluwarsa)"
    exit 1
fi

LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse origin/main)"
HEAD_TIME="$(git log -1 --format=%ct HEAD)"
DIST_TIME=0
[ -f "$DIST_INDEX" ] && DIST_TIME="$(stat -c %Y "$DIST_INDEX")"
INFO_COMMIT=""
if [ -f "$LIVE_DEPLOY_INFO" ]; then
    INFO_COMMIT="$(python3 -c "import json;print(json.load(open('$LIVE_DEPLOY_INFO')).get('commit',''))" 2>/dev/null || true)"
elif [ -f "$DEPLOY_INFO" ]; then
    INFO_COMMIT="$(python3 -c "import json;print(json.load(open('$DEPLOY_INFO')).get('commit',''))" 2>/dev/null || true)"
fi
PM2_STATE="$(pm2 jlist 2>/dev/null | python3 -c "import json,sys;print(next((a['pm2_env']['status'] for a in json.load(sys.stdin) if a['name']=='icofr-backend'),'missing'))" 2>/dev/null || echo unknown)"

NEED_REASON=""
if [ "$LOCAL" != "$REMOTE" ]; then
    NEED_REASON="commit baru di remote ($LOCAL -> $REMOTE)"
elif [ ! -f "$LIVE_INDEX" ] || [ ! -f "$DIST_INDEX" ]; then
    NEED_REASON="hasil build hilang (live/dist index.html tidak ada)"
elif [ "$DIST_TIME" -lt "$HEAD_TIME" ]; then
    NEED_REASON="build basi (dist lebih tua dari HEAD)"
elif [ "$INFO_COMMIT" != "$LOCAL" ]; then
    NEED_REASON="deploy-info tidak cocok (live: ${INFO_COMMIT:-kosong}, HEAD: $LOCAL)"
fi

if [ "$MODE" = "check" ]; then
    log "CHECK head=$LOCAL remote=$REMOTE pm2=$PM2_STATE dist_time=$DIST_TIME head_time=$HEAD_TIME live_commit=${INFO_COMMIT:-kosong}"
    if [ -n "$NEED_REASON" ]; then log "CHECK hasil: BUTUH DEPLOY ($NEED_REASON)"; exit 1; fi
    log "CHECK hasil: SEHAT (git sinkron, build segar)"
    exit 0
fi

if [ -z "$NEED_REASON" ] && [ "$MODE" != "force" ]; then
    log "Kode sudah up-to-date dan build segar (head=$LOCAL)."
    exit 0
fi
if [ "$MODE" = "force" ]; then
    log "Mode --force: rebuild + reload tanpa pull (alasan: ${NEED_REASON:-dipaksa manual})."
else
    log "Deteksi perubahan: $NEED_REASON. Memulai update..."
fi

OLD_REV="$LOCAL"
STASHED=0
STASH_REF=""

# 1-2. Samakan kode HANYA bila ada commit baru di remote (server wajib mirror
#      remote; fast-forward only). File tracked yg kotor (mis. bun.lock hasil
#      bun install) diamankan dulu via stash-backup supaya `git pull` tidak
#      pernah abort. Mode --force TIDAK menyentuh git sama sekali: ia membangun
#      working tree apa adanya (termasuk perubahan lokal di server dev).
if [ "$MODE" != "force" ]; then
    STASHED=0
    STASH_REF=""

    # 1. Amankan perubahan riil / uncommitted files terlebih dahulu ke backup stash
    if ! git diff --quiet || ! git diff --cached --quiet; then
        # Cek apakah dirty state semata-mata karena drift CRLF/attributes
        # Uji renormalize tanpa merusak uncommitted working tree
        log "Working tree kotor, auto-stash sebagai backup:"
        git status --short
        if git stash push -m "ci-auto-stash $(date -Is)"; then
            STASHED=1
            STASH_REF="$(git rev-parse 'stash@{0}')"
        else
            log "FATAL: git stash gagal"
            exit 1
        fi
    fi

    # 2. Setelah kerjaan lokal aman di stash (atau working tree bersih), bersihkan phantom drift line-ending
    git add --renormalize . 2>/dev/null || true
    git checkout -- . 2>/dev/null || true

    # 3. Tarik update terbaru secara fast-forward
    if ! git pull --ff-only origin main; then
        log "FATAL: git pull --ff-only gagal (kemungkinan ada commit lokal di server). Periksa manual: git log --oneline -5; git status"
        [ "$STASHED" = "1" ] && git stash pop || true
        exit 1
    fi
fi
NEW_REV="$(git rev-parse HEAD)"

# 3. Stash hanya di-drop bila isinya identik dgn HEAD baru; selebihnya disimpan.
if [ "$MODE" != "force" ] && [ "$STASHED" = "1" ]; then
    if git diff --quiet "$STASH_REF" "$NEW_REV" -- . 2>/dev/null; then
        git stash drop || true
        log "Backup stash sama persis dgn HEAD baru, sudah di-drop."
    else
        log "WARN: backup stash BERBEDA dari HEAD baru -> DISIMPAN, tidak di-pop otomatis."
        log "WARN: inspeksi manual: git stash show -p 'stash@{0}' ; git stash list"
    fi
fi

# 4. Toolchain check dgn pesan jelas (dulu: 'bun: command not found' lalu false-sukses).
if ! command -v bun >/dev/null 2>&1; then
    log "FATAL: bun tidak ditemukan di PATH=$PATH"
    exit 1
fi

log "Menjalankan bun install (frozen-lockfile jika memungkinkan)..."
bun install || { log "FATAL: bun install gagal"; exit 1; }
log "bun install selesai."

# 5. Migrasi DB hanya bila file skema berubah antar-revisi (hemat + aman utk change frontend-only).
if [ "$NEW_REV" != "$OLD_REV" ]; then
    SCHEMA_CHANGED="$(git diff --name-only "$OLD_REV" "$NEW_REV" -- worker/db drizzle drizzle.config.ts || true)"
    if [ -n "$SCHEMA_CHANGED" ]; then
        log "Skema berubah, menjalankan migrasi:"
        echo "$SCHEMA_CHANGED"
        [ -f .env ] && { set -a; . ./.env; set +a; }
        if [ -z "${DATABASE_URL:-}" ]; then
            log "FATAL: DATABASE_URL kosong, migrasi dibatalkan"
            exit 1
        fi
        log "Memastikan ekstensi DB (vector, pg_trgm, ADR-0003)..."
        if command -v psql >/dev/null 2>&1; then
            psql "$DATABASE_URL" -f scripts/db-extensions.sql || { log "FATAL: db-extensions gagal"; exit 1; }
        else
            log "psql tidak ada, setup ekstensi via driver node (scripts/db-extensions.mjs)..."
            node scripts/db-extensions.mjs || { log "FATAL: db-extensions via node gagal"; exit 1; }
        fi
        bunx drizzle-kit push --force || { log "FATAL: drizzle push gagal"; exit 1; }
    else
        log "Skema tidak berubah, migrasi dilewati."
    fi
else
    log "Revisi sama ($NEW_REV), migrasi dilewati."
fi

# 6. Build frontend utk Apache.
log "Menjalankan bun run build (Vite frontend bundling)..."
bun run build || { log "FATAL: bun run build gagal"; exit 1; }
log "bun run build selesai."

# 7. Cap versi build agar user bisa verifikasi yg sedang tayang.
python3 - "$NEW_REV" "$DEPLOY_INFO" <<'EOF' || { echo "FATAL: tulis deploy-info gagal"; exit 1; }
import json, sys, datetime
info = {"commit": sys.argv[1], "branch": "main",
        "builtAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "builtBy": "deploy.sh"}
open(sys.argv[2], "w").write(json.dumps(info, indent=2) + "\n")
EOF

# 8. Rilis atomik: sinkronkan hasil build ke folder live produksi Apache (/var/www/icofr)
log "Menyinkronkan aset web ke direktori produksi $LIVE_DIR..."
mkdir -p "$LIVE_DIR"
if ! rsync -a --delete dist/client/ "$LIVE_DIR/"; then
    log "FATAL: rsync ke $LIVE_DIR gagal"
    exit 1
fi
log "Sinkronisasi ke $LIVE_DIR selesai."

# 9. Reload backend.
PM2_BIN="$(command -v pm2 || echo /home/ubuntu/.nvm/versions/node/v20.20.2/bin/pm2)"
"$PM2_BIN" reload icofr-backend || { log "FATAL: pm2 reload gagal"; exit 1; }

# 10. Health gate: klaim sukses hanya bila semuanya terbukti.
sleep 5
LIVE_COMMIT="$(python3 -c "import json;print(json.load(open('$LIVE_DEPLOY_INFO')).get('commit',''))" 2>/dev/null || true)"
[ "$LIVE_COMMIT" = "$NEW_REV" ] || { log "FATAL: live deploy-info tidak cocok ($LIVE_COMMIT != $NEW_REV)"; exit 1; }
[ -f "$LIVE_INDEX" ] || { log "FATAL: live index.html tidak ditemukan di $LIVE_INDEX"; exit 1; }
PM2_NOW="unknown"
for _ in 1 2 3 4 5; do
  PM2_NOW="$("$PM2_BIN" jlist 2>/dev/null | python3 -c "import json,sys;raw=sys.stdin.read();idx=raw.find('[');data=json.loads(raw[idx:]) if idx!=-1 else [];print(next((a['pm2_env']['status'] for a in data if a['name']=='icofr-backend'),'missing'))" 2>/dev/null || echo unknown)"
  [ "$PM2_NOW" = "online" ] && break
  sleep 1
done
[ "$PM2_NOW" = "online" ] || { log "FATAL: icofr-backend tidak online (status: $PM2_NOW)"; exit 1; }
HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$BACKEND_URL" || echo 000)"
case "$HTTP_CODE" in
    000) log "FATAL: backend tidak menjawab di $BACKEND_URL"; exit 1 ;;
    5*)  log "FATAL: backend error (HTTP $HTTP_CODE di $BACKEND_URL)"; exit 1 ;;
    *)   log "Backend menjawab (HTTP $HTTP_CODE)." ;;
esac

log "Deployment sukses: commit=$NEW_REV pm2=$PM2_NOW backend_http=$HTTP_CODE live_dir=$LIVE_DIR"
