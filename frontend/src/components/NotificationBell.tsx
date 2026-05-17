import { useCallback, useEffect, useRef, useState } from "react";
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  type Notification,
} from "@/api/notifications";
import { extractApiError } from "@/lib/errors";
import Icon from "./ui/Icon";

function formatTime(value: string) {
  return value.replace("T", " ").slice(0, 16);
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const refreshItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listNotifications({ unread: true, page_size: 6 });
      setItems(data.results);
      setUnreadCount(data.count);
    } catch (err) {
      setError(extractApiError(err, "Không tải được thông báo."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (open) refreshItems();
  }, [open, refreshItems]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  async function markRead() {
    await markAllNotificationsRead();
    await refreshItems();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-8 h-8 rounded-md text-ink-muted hover:bg-surface grid place-items-center relative"
        aria-label="Thông báo"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Icon name="bell" size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-danger border-2 border-card" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 w-[360px] rounded-xl border border-line bg-card shadow-elevated">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <Icon name="bell" size={18} className="text-navy-600" />
              <span>Thông báo</span>
            </div>
            <button
              type="button"
              onClick={markRead}
              disabled={loading || items.length === 0}
              className="rounded-md px-2.5 py-1 text-[12.5px] font-medium text-navy-600 hover:bg-navy-50 disabled:text-ink-faint disabled:hover:bg-transparent"
            >
              Đánh dấu đã đọc
            </button>
          </div>

          <div className="px-4 pt-3">
            <div className="inline-flex rounded-full border border-navy-300 p-1">
              <span className="rounded-full bg-navy-600 px-4 py-1.5 text-[13px] font-semibold text-white">
                Chưa đọc
              </span>
            </div>
          </div>

          <div className="min-h-[220px] max-h-[360px] overflow-auto px-3 py-3">
            {loading ? (
              <div className="py-16 text-center text-[13px] text-ink-muted">
                Đang tải thông báo...
              </div>
            ) : error ? (
              <div className="py-16 text-center text-[13px] text-danger">{error}</div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center text-[14px] italic text-ink-muted">
                Không có thông báo mới
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="rounded-lg border border-line bg-surface px-3 py-2.5">
                    <div className="text-[13.5px] font-semibold text-ink line-clamp-2">
                      {item.title}
                    </div>
                    <div className="mt-1 text-[12.5px] text-ink-muted line-clamp-2">
                      {item.body}
                    </div>
                    <div className="mt-2 text-[11.5px] font-mono text-ink-faint">
                      {formatTime(item.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
