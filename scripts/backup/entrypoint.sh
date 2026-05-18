#!/bin/sh
# Entry point cho container backup service.
# - Tạo log file để tail
# - Chạy backup ngay 1 lần lúc start (để verify config đúng)
# - Khởi động cron (background)
# - Tail log file để container không exit + log hiển thị qua docker logs

set -eu

mkdir -p /backups
touch /var/log/backup.log

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup service khởi động."
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Lịch cron: $(cat /etc/crontabs/root)"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Timezone: $(date +%Z)"

# Chạy backup 1 lần ngay để verify (KHÔNG bắt buộc cho production —
# có thể comment dòng dưới nếu chỉ muốn chạy đúng giờ).
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Chạy backup khởi động..."
/usr/local/bin/backup.sh >> /var/log/backup.log 2>&1 || \
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] CẢNH BÁO: backup khởi động fail (DB chưa sẵn sàng?), cron vẫn chạy bình thường."

# Khởi động cron (dcron foreground = -f)
crond -f -l 8 &
CRON_PID=$!

# Tail log file để hiển thị backup output qua `docker logs`
tail -f /var/log/backup.log &
TAIL_PID=$!

# Wait cho cron (process chính)
wait $CRON_PID
