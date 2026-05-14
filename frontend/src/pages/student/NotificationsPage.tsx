import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, Modal, Pagination } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import {
  AUDIENCE_LABELS,
  CATEGORY_LABELS,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotiAudience,
  type NotiCategory,
  type Notification,
} from "@/api/notifications";
import { extractApiError } from "@/lib/errors";
import { PAGE_SIZE } from "@/lib/constants";

const CATEGORY_TONE: Record<NotiCategory, "neutral" | "accent" | "warn" | "success" | "danger"> = {
  REGISTRATION: "accent",
  SCHEDULE: "warn",
  CLASS: "success",
  SYSTEM: "danger",
  OTHER: "neutral",
};

const CATEGORY_ICON: Record<NotiCategory, "megaphone" | "calendar" | "clipboard" | "settings" | "bell"> = {
  REGISTRATION: "megaphone",
  SCHEDULE: "calendar",
  CLASS: "clipboard",
  SYSTEM: "settings",
  OTHER: "bell",
};

const AUDIENCE_TONE: Record<NotiAudience, "neutral" | "accent" | "success" | "warn"> = {
  ALL: "accent",
  ALL_STUDENTS: "success",
  ALL_TEACHERS: "warn",
  SPECIFIC: "neutral",
};

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`;
  return iso.replace("T", " ").slice(0, 16);
}

export default function StudentNotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Notification | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listNotifications({ page });
      setItems(data.results);
      setTotal(data.count);
    } catch (err) {
      setError(extractApiError(err, "Không tải được thông báo."));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleView(n: Notification) {
    setViewing(n);
    if (!n.is_read) {
      try {
        await markNotificationRead(n.id);
        setItems((arr) => arr.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      } catch {
        // ignore
      }
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setItems((arr) => arr.map((x) => ({ ...x, is_read: true })));
    } catch (err) {
      setError(extractApiError(err, "Không đánh dấu được."));
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
            Thông báo
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            Tổng cộng <span className="font-semibold text-ink">{total}</span> thông báo
            {unreadCount > 0 && (
              <>
                {" · "}
                <Badge tone="danger">{unreadCount} chưa đọc</Badge>
              </>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button icon="check" onClick={handleMarkAllRead} disabled={markingAll}>
            {markingAll ? "Đang xử lý..." : "Đánh dấu đã đọc tất cả"}
          </Button>
        )}
      </div>

      {error && (
        <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-ink-muted">Đang tải...</div>
      ) : items.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-xl bg-surface text-ink-faint grid place-items-center mx-auto mb-3">
              <Icon name="bell" size={28} />
            </div>
            <div className="text-[15px] font-semibold text-ink">Chưa có thông báo nào</div>
            <p className="text-[13px] text-ink-muted mt-1">
              Bạn sẽ nhận thông báo khi nhà trường mở đăng ký, đổi lịch học hoặc có cập nhật khác.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const tone = CATEGORY_TONE[n.category];
            const iconName = CATEGORY_ICON[n.category];
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleView(n)}
                className={`w-full text-left bg-card rounded-xl border ${
                  n.is_read ? "border-line" : "border-navy-200 ring-1 ring-navy-50"
                } px-4 py-3.5 flex items-start gap-3 hover:bg-cardAlt transition-colors`}
              >
                <div
                  className={`w-10 h-10 rounded-lg grid place-items-center flex-shrink-0 ${
                    tone === "accent"
                      ? "bg-navy-50 text-navy-600"
                      : tone === "warn"
                      ? "bg-amber-100 text-warn"
                      : tone === "success"
                      ? "bg-green-100 text-success"
                      : tone === "danger"
                      ? "bg-red-100 text-danger"
                      : "bg-surface text-ink-muted"
                  }`}
                >
                  <Icon name={iconName} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[14px] ${
                        n.is_read ? "font-medium text-ink" : "font-semibold text-ink"
                      } truncate`}
                    >
                      {n.title}
                    </span>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-navy-600 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[13px] text-ink-muted line-clamp-2">{n.body}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge tone={tone}>{n.category_display}</Badge>
                    <Badge tone={AUDIENCE_TONE[n.audience]}>{n.audience_display}</Badge>
                    <span className="text-[11.5px] text-ink-faint">
                      {relativeTime(n.created_at)}
                    </span>
                  </div>
                </div>
                <Icon name="chevronRight" size={16} className="text-ink-faint flex-shrink-0 mt-2" />
              </button>
            );
          })}
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      {/* Detail modal */}
      <Modal
        open={viewing !== null}
        title={viewing?.title ?? ""}
        subtitle={
          viewing
            ? `${CATEGORY_LABELS[viewing.category]} · ${AUDIENCE_LABELS[viewing.audience]} · ${relativeTime(viewing.created_at)}`
            : ""
        }
        onClose={() => setViewing(null)}
        size="lg"
        footer={
          <Button variant="ghost" onClick={() => setViewing(null)}>
            Đóng
          </Button>
        }
      >
        {viewing && (
          <div className="space-y-3">
            <p className="whitespace-pre-wrap text-[13.5px] text-ink leading-relaxed">
              {viewing.body}
            </p>
            <div className="flex items-center gap-2 text-[11.5px] text-ink-faint pt-2 border-t border-line">
              <Icon name="user" size={13} />
              <span>
                Từ: <strong className="text-ink">{viewing.sender_username ?? "Hệ thống"}</strong>
              </span>
              <span>·</span>
              <span>{new Date(viewing.created_at).toLocaleString("vi-VN")}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
