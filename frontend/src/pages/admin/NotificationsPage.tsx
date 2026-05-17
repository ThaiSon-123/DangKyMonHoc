import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Badge, Button, Card, Modal, Pagination, Table, type Column } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import {
  AUDIENCE_LABELS,
  CATEGORY_LABELS,
  createNotification,
  deleteNotification,
  listNotifications,
  type NotiAudience,
  type NotiCategory,
  type Notification,
  type NotificationInput,
} from "@/api/notifications";
import { listUsers } from "@/api/users";
import { extractApiError } from "@/lib/errors";
import { showErrorToast } from "@/lib/toast";
import { PAGE_SIZE } from "@/lib/constants";
import type { User } from "@/types";

const CATEGORY_TONE: Record<NotiCategory, "neutral" | "accent" | "warn" | "success" | "danger"> = {
  REGISTRATION: "accent",
  SCHEDULE: "warn",
  CLASS: "success",
  SYSTEM: "danger",
  OTHER: "neutral",
};

const AUDIENCE_TONE: Record<NotiAudience, "neutral" | "accent" | "success" | "warn"> = {
  ALL: "accent",
  ALL_STUDENTS: "success",
  ALL_TEACHERS: "warn",
  SPECIFIC: "neutral",
};

const EMPTY: NotificationInput = {
  title: "",
  body: "",
  category: "OTHER",
  audience: "ALL",
  recipients: [],
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NotificationInput>(EMPTY);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [viewing, setViewing] = useState<Notification | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listNotifications({
        search: appliedSearch || undefined,
        page,
      });
      setItems(data.results);
      setTotal(data.count);
    } catch (err) {
      setError(extractApiError(err, "Không tải được danh sách thông báo."));
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, page]);

  useEffect(() => {
    // Fetch user list cho dropdown người nhận cụ thể
    listUsers({ page_size: 1000 }).then((r) => setAllUsers(r.results));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function applySearch() {
    setPage(1);
    setAppliedSearch(search);
  }

  function openCreate() {
    setForm(EMPTY);
    setRecipientSearch("");
    setFormError(null);
    setShowForm(true);
  }

  const filteredRecipientCandidates = useMemo(() => {
    const q = recipientSearch.trim().toLowerCase();
    const selected = new Set(form.recipients ?? []);
    const filtered = allUsers
      .filter((u) => !selected.has(u.id) && u.role !== "ADMIN")
      .filter((u) => {
        if (!q) return true;
        return (
          u.username.toLowerCase().includes(q) ||
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        );
      });
    return filtered.slice(0, 8);
  }, [allUsers, form.recipients, recipientSearch]);

  const selectedRecipients = useMemo(
    () =>
      (form.recipients ?? [])
        .map((id) => allUsers.find((u) => u.id === id))
        .filter((u): u is User => Boolean(u)),
    [allUsers, form.recipients],
  );

  function addRecipient(u: User) {
    setForm((current) => ({
      ...current,
      recipients: [...(current.recipients ?? []), u.id],
    }));
    setRecipientSearch("");
  }

  function removeRecipient(id: number) {
    setForm((current) => ({
      ...current,
      recipients: (current.recipients ?? []).filter((rid) => rid !== id),
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      // Nếu audience không phải SPECIFIC, clear recipients
      const payload: NotificationInput = {
        ...form,
        recipients: form.audience === "SPECIFIC" ? form.recipients : [],
      };
      if (payload.audience === "SPECIFIC" && (!payload.recipients || payload.recipients.length === 0)) {
        setFormError("Audience 'Danh sách cụ thể' yêu cầu chọn ít nhất 1 người nhận.");
        setSubmitting(false);
        return;
      }
      await createNotification(payload);
      setShowForm(false);
      await refresh();
    } catch (err) {
      const message = extractApiError(err);
      setFormError(message);
      showErrorToast(message, "Không gửi được thông báo");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteNotification(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      setError(extractApiError(err, "Không xoá được thông báo."));
      setDeleteTarget(null);
    }
  }

  const columns: Column<Notification>[] = [
    {
      key: "title",
      label: "Tiêu đề",
      render: (n) => (
        <button
          type="button"
          onClick={() => setViewing(n)}
          className="text-left text-navy-600 hover:underline font-medium"
        >
          {n.title}
        </button>
      ),
    },
    {
      key: "category",
      label: "Loại",
      width: "150px",
      render: (n) => <Badge tone={CATEGORY_TONE[n.category]}>{n.category_display}</Badge>,
    },
    {
      key: "audience",
      label: "Đối tượng",
      width: "180px",
      render: (n) => (
        <div>
          <Badge tone={AUDIENCE_TONE[n.audience]}>{n.audience_display}</Badge>
          {n.audience === "SPECIFIC" && (
            <div className="text-[11.5px] text-ink-faint mt-0.5">
              {n.recipients.length} người nhận
            </div>
          )}
        </div>
      ),
    },
    {
      key: "sender_username",
      label: "Người gửi",
      width: "140px",
      mono: true,
      render: (n) => n.sender_username || <span className="text-ink-faint">—</span>,
    },
    {
      key: "created_at",
      label: "Gửi lúc",
      width: "150px",
      render: (n) => (
        <span className="font-mono text-[12px] text-ink-muted">
          {n.created_at.replace("T", " ").slice(0, 16)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "120px",
      align: "right",
      render: (n) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" icon="doc" onClick={() => setViewing(n)}>
            Xem
          </Button>
          <Button size="sm" variant="ghost" icon="trash" onClick={() => setDeleteTarget(n)}>
            Xoá
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
            Gửi thông báo
          </h1>
        </div>
        <Button variant="primary" icon="megaphone" onClick={openCreate}>
          Soạn thông báo
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface border border-line w-72">
            <Icon name="search" size={15} className="text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="Tìm trong tiêu đề / nội dung…"
              className="flex-1 bg-transparent outline-none text-[13px] min-w-0"
            />
          </div>
          <Button onClick={applySearch}>Tìm</Button>
          {appliedSearch && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setAppliedSearch("");
                setPage(1);
              }}
            >
              Xoá filter
            </Button>
          )}
        </div>

        {error && (
          <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">
            {error}
          </div>
        )}

        <Table
          columns={columns}
          rows={items}
          rowKey={(n) => n.id}
          loading={loading}
          emptyText="Chưa có thông báo nào. Bấm 'Soạn thông báo' để gửi."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      </Card>

      {/* Compose modal */}
      <Modal
        open={showForm}
        title="Soạn thông báo"
        subtitle="Sẽ gửi ngay khi nhấn Gửi"
        onClose={() => setShowForm(false)}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Huỷ
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="noti-form"
              icon="megaphone"
              disabled={submitting}
            >
              {submitting ? "Đang gửi..." : "Gửi"}
            </Button>
          </>
        }
      >
        <form id="noti-form" onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Tiêu đề *</Label>
            <input
              required
              maxLength={200}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Mở đợt đăng ký môn học HK1 2026-2027"
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div>
            <Label>Nội dung *</Label>
            <textarea
              required
              rows={5}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Sinh viên đăng ký từ ngày 14/05 đến 30/05. Đăng nhập vào hệ thống để chọn lớp..."
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none resize-y"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Loại thông báo *</Label>
              <select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as NotiCategory })}
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
              <Label>Đối tượng *</Label>
              <select
                required
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value as NotiAudience })}
                className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
              >
                {Object.entries(AUDIENCE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {form.audience === "SPECIFIC" && (
            <div>
              <Label>Người nhận cụ thể *</Label>
              {selectedRecipients.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedRecipients.map((u) => (
                    <span
                      key={u.id}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-navy-50 text-navy-600 text-[12.5px]"
                    >
                      <span className="font-mono">{u.username}</span>
                      <span className="text-ink-muted">·</span>
                      <span>{u.full_name || u.username}</span>
                      <button
                        type="button"
                        onClick={() => removeRecipient(u.id)}
                        className="ml-0.5 hover:text-danger"
                      >
                        <Icon name="x" size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative">
                <input
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  placeholder="Tìm theo username / họ tên / email…"
                  className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
                />
                {filteredRecipientCandidates.length > 0 && (
                  <div className="mt-1 max-h-48 overflow-auto border border-line rounded-md bg-card divide-y divide-line">
                    {filteredRecipientCandidates.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => addRecipient(u)}
                        className="w-full text-left px-3 py-2 hover:bg-surface flex items-center gap-2 text-[13px]"
                      >
                        <span className="font-mono text-[12px] text-ink-muted">{u.username}</span>
                        <span>{u.full_name || "—"}</span>
                        <span className="ml-auto text-[11.5px] text-ink-faint">{u.role}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {formError && (
            <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {formError}
            </div>
          )}
        </form>
      </Modal>

      {/* View modal */}
      <Modal
        open={viewing !== null}
        title={viewing?.title ?? ""}
        subtitle={
          viewing
            ? `${viewing.category_display} · ${viewing.audience_display} · ${viewing.created_at
                .replace("T", " ")
                .slice(0, 16)}`
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
            {viewing.audience === "SPECIFIC" && viewing.recipients.length > 0 && (
              <div>
                <div className="text-[12.5px] font-medium text-ink mt-3 mb-1.5">
                  Người nhận ({viewing.recipients.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {viewing.recipients.map((rid) => {
                    const u = allUsers.find((x) => x.id === rid);
                    return (
                      <span
                        key={rid}
                        className="px-2 py-1 rounded-md bg-surface text-[12px] font-mono"
                      >
                        {u ? u.username : `#${rid}`}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete modal */}
      <Modal
        open={deleteTarget !== null}
        title="Xoá thông báo"
        subtitle={deleteTarget?.title ?? ""}
        onClose={() => setDeleteTarget(null)}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Huỷ
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Xoá
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] text-ink">
          Xoá thông báo này sẽ xoá luôn trạng thái đã đọc của tất cả người nhận. Không thể hoàn
          tác.
        </p>
      </Modal>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[12.5px] font-medium text-ink mb-1.5">{children}</div>;
}
