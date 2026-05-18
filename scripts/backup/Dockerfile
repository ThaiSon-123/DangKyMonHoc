FROM alpine:3.20

# Cài postgresql-client (cho pg_dump/psql) + dcron (lightweight cron)
RUN apk add --no-cache postgresql16-client dcron tzdata && \
    cp /usr/share/zoneinfo/Asia/Ho_Chi_Minh /etc/localtime && \
    echo "Asia/Ho_Chi_Minh" > /etc/timezone

# Copy scripts
COPY backup.sh /usr/local/bin/backup.sh
COPY restore.sh /usr/local/bin/restore.sh
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/restore.sh /entrypoint.sh

# Cron: chạy backup vào 00:00 mỗi ngày
# Stdout/stderr ghi ra log để docker logs đọc được
RUN echo "0 0 * * * /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1" > /etc/crontabs/root

ENTRYPOINT ["/entrypoint.sh"]
