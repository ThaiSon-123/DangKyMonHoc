#!/bin/sh
# Khôi phục PostgreSQL từ file backup.
# Cách dùng: ./restore.sh <path-to-backup.sql.gz>
# Hoặc liệt kê các backup hiện có: ./restore.sh --list

set -eu

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-dangkymonhoc}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"

if [ $# -eq 0 ] || [ "${1:-}" = "--list" ]; then
  echo "Danh sách backup hiện có trong $BACKUP_DIR:"
  ls -lh "$BACKUP_DIR"/dkmh_*.sql.gz 2>/dev/null | sort -r || echo "  (không có backup)"
  echo ""
  echo "Cách khôi phục: $0 <path-to-backup.sql.gz>"
  echo "Ví dụ:          $0 ${BACKUP_DIR}/dkmh_20260518_000000.sql.gz"
  exit 0
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Không tìm thấy file backup: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  CẢNH BÁO: Sẽ XOÁ toàn bộ schema/data hiện tại của $DB_NAME"
echo "    và thay bằng nội dung từ: $BACKUP_FILE"
echo ""
printf "Tiếp tục? (yes/no): "
read CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Đã huỷ."
  exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Bắt đầu khôi phục từ $BACKUP_FILE..."

gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -v ON_ERROR_STOP=1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Khôi phục thành công."
