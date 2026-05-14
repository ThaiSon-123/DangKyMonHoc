import { useCallback, useEffect, useState, type FormEvent } from "react";
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
import { listClassSections, notifyClass, type NotifyClassInput } from "@/api/classes";
import { getMyTeacherProfile } from "@/api/teachers";
import { extractApiError } from "@/lib/errors";
import { PAGE_SIZE } from "@/lib/constants";
import type { ClassSection } from "@/types/domain";

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

type ComposeForm = NotifyClassInput & { class_section: number | "" };

const INITIAL_COMPOSE: ComposeForm = {
  class_section: "",
  title: "",
  body: "",
  category: "CLASS",
};

export default function TeacherNotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Notification | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  // Compose state
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [composeForm, setComposeForm] = useState<ComposeForm>(INITIAL_COMPOSE);
  const [submitting, setSubmitting] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeSuccess, setComposeSuccess] = useState<string | null>(null);

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

  // Load classes có SV (để compose)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const teacher = await getMyTeacherProfile();
        const data = await listClassSections({ teacher: teacher.id, page_size: 1000 });
        if (cancelled) return;
        // Chỉ giữ lớp có sinh viên
        setClasses(data.results.filter((c) => (c.enrolled_count ?? 0) > 0));
      } catch {
        // Lỗi tải lớp không chặn trang noti
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  function openCompose() {
    setComposeForm({
      ...INITIAL_COMPOSE,
      class_section: classes[0]?.id ?? "",
    });
    setComposeError(null);
    setShowCompose(true);
  }

  async function handleSendCompose(e: FormEvent) {
    e.preventDefault();
    if (!composeForm.class_section) {
      setComposeError("Vui lòng chọn lớp.");
      return;
    }
    setSubmitting(true);
    setComposeError(null);
    try {
      const result = await notifyClass(Number(composeForm.class_section), {
        title: composeForm.title,
        body: composeForm.body,
        category: composeForm.category,
      });
      setComposeSuccess(
        `Đã gửi "${result.notification.title}" tới ${result.recipient_count} SV lớp ${result.class_code}.`,
      );
      setShowCompose(false);
      setComposeForm(INITIAL_COMPOSE);
      setTimeout(() => setComposeSuccess(null), 5000);
      // Reload để noti mình vừa gửi xuất hiện trong list (do thuộc Q(sender=user))
      refresh();
    } catch (err) {
      setComposeError(extractApiError(err, "Không gửi được thông báo."));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedClass = classes.find((c) => c.id === composeForm.class_section);

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
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button icon="check" onClick={handleMarkAllRead} disabled={markingAll}>
              {markingAll ? "Đang xử lý..." : "Đánh dấu đã đọc tất cả"}
            </Button>
          )}
          <Button
            variant="primary"
            icon="megaphone"
            onClick={openCompose}
            disabled={classes.length === 0}
            title={
              classes.length === 0
                ? "Bạn chưa có lớp nào có sinh viên CONFIRMED"
                : ""
            }
          >
            Soạn thông báo
          </Button>
        </div>
      </div>

      {composeSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md px-3 py-2 text-[13px] text-success flex items-start gap-2">
          <Icon name="check" size={16} className="mt-0.5 flex-shrink-0" />
          <div>{composeSuccess}</div>
        </div>
      )}

      {classes.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-[12.5px] text-warn flex items-start gap-2">
          <Icon name="bell" size={14} className="mt-0.5 flex-shrink-0" />
          <div>
            Để soạn thông báo gửi sinh viên, bạn cần có ít nhất 1 lớp phụ trách có SV đã CONFIRMED.
          </div>
        </div>
      )}

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
                    {n.audience === "SPECIFIC" && (
                      <span className="text-[11.5px] text-ink-faint">
                        {n.recipients.length} người nhận
                      </span>
                    )}
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
              {viewing.audience === "SPECIFIC" && (
                <>
                  <span>·</span>
                  <span>{viewing.recipients.length} người nhận</span>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Compose modal */}
      <Modal
        open={showCompose}
        title="Soạn thông báo gửi lớp"
        subtitle="Gửi tới toàn bộ SV đã CONFIRMED của một lớp bạn phụ trách"
        onClose={() => setShowCompose(false)}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCompose(false)}>
              Huỷ
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="compose-noti-form"
              icon="megaphone"
              disabled={submitting}
            >
              {submitting
                ? "Đang gửi..."
                : selectedClass
                ? `Gửi cho ${selectedClass.enrolled_count} SV`
                : "Gửi"}
            </Button>
          </>
        }
      >
        <form id="compose-noti-form" onSubmit={handleSendCompose} className="space-y-3">
          <div>
            <Label>Lớp nhận *</Label>
            <select
              required
              value={composeForm.class_section}
              onChange={(e) =>
                setComposeForm({
                  ...composeForm,
                  class_section: e.target.value ? Number(e.target.value) : "",
                })
              }
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            >
              <option value="">— Chọn lớp —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.course_name} ({c.enrolled_count} SV)
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Tiêu đề *</Label>
            <input
              required
              maxLength={200}
              value={composeForm.title}
              onChange={(e) => setComposeForm({ ...composeForm, title: e.target.value })}
              placeholder="Vd: Đổi phòng học buổi sau"
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div>
            <Label>Loại thông báo</Label>
            <select
              value={composeForm.category}
              onChange={(e) =>
                setComposeForm({
                  ...composeForm,
                  category: e.target.value as NotiCategory,
                })
              }
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            >
              {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Nội dung *</Label>
            <textarea
              required
              rows={5}
              value={composeForm.body}
              onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
              placeholder="Nội dung chi tiết... vd. Tuần sau lớp đổi sang phòng B5.10 từ 13h-15h30..."
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none resize-y"
            />
          </div>
          {selectedClass && (
            <div className="bg-navy-50 border border-navy-100 rounded-md px-3 py-2 text-[12px] text-navy-900 flex items-start gap-2">
              <Icon name="bell" size={14} className="mt-0.5 flex-shrink-0" />
              <div>
                Thông báo sẽ gửi tới <strong>{selectedClass.enrolled_count} sinh viên</strong>{" "}
                CONFIRMED của lớp{" "}
                <code className="font-mono bg-card px-1 rounded">{selectedClass.code}</code>.
              </div>
            </div>
          )}
          {composeError && (
            <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {composeError}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12.5px] font-medium text-ink mb-1.5">{children}</div>
  );
}
