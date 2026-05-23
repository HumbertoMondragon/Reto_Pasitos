#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# backup.sh — PostgreSQL backup for Pasitos Platform
#
# Usage:
#   ./scripts/backup.sh                    # uses DIRECT_DATABASE_URL from .env
#   DIRECT_DATABASE_URL=postgresql://... ./scripts/backup.sh
#
# The backup is saved to ./backups/pasitos-YYYY-MM-DD_HH-MM-SS.sql.gz
#
# Schedule with cron (daily at 2am):
#   0 2 * * * /path/to/pasitos-platform/scripts/backup.sh >> /var/log/pasitos-backup.log 2>&1
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# Load .env if present and DIRECT_DATABASE_URL is not already set
if [ -z "${DIRECT_DATABASE_URL:-}" ] && [ -f "$(dirname "$0")/../.env" ]; then
  export $(grep -v '^#' "$(dirname "$0")/../.env" | grep DIRECT_DATABASE_URL | xargs)
fi

if [ -z "${DIRECT_DATABASE_URL:-}" ]; then
  echo "ERROR: DIRECT_DATABASE_URL is not set." >&2
  exit 1
fi

BACKUP_DIR="$(dirname "$0")/../backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="pasitos-${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

echo "[$(date -Is)] Starting backup → ${FILEPATH}"
pg_dump "$DIRECT_DATABASE_URL" | gzip > "$FILEPATH"
echo "[$(date -Is)] Backup completed. Size: $(du -sh "$FILEPATH" | cut -f1)"

# Keep only the 30 most recent backups
ls -t "${BACKUP_DIR}"/pasitos-*.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm --
echo "[$(date -Is)] Old backups pruned (keeping 30 most recent)."
