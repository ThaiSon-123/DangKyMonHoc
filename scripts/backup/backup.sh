#!/bin/sh
# Backup PostgreSQL hàng ngày, giữ 7 bản gần nhất.
# Chạy bởi cron service trong docker-compose (xem docker-compose.yml).
# Env vars cần có: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, BACKUP_DIR, BACKUP_RETENTION_DAYS

set -eu

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-dangkymonhoc}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="${BACKUP_DIR}/dkmh_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Bắt đầu backup → $OUTPUT_FILE"

# pg_dump với compress level 6 (cân bằng size/CPU)
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  | gzip -6 > "$OUTPUT_FILE"

SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup xong ($SIZE) → $OUTPUT_FILE"

# Xoá các backup cũ hơn RETENTION_DAYS ngày
DELETED=$(find "$BACKUP_DIR" -name "dkmh_*.sql.gz" -type f -mtime "+${RETENTION_DAYS}" -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Đã xoá $DELETED backup cũ hơn ${RETENTION_DAYS} ngày."
fi

# Liệt kê các backup hiện có (sorted by date desc)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Danh sách backup hiện có:"
ls -lh "$BACKUP_DIR"/dkmh_*.sql.gz 2>/dev/null | sort -r || echo "  (chưa có backup nào khác)"
