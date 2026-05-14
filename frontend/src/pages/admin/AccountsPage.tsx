import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Badge, Button, Card, Modal, Pagination, Table, type Column } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
  type UserCreateInput,
} from "@/api/users";
import { listMajors } from "@/api/majors";
import { extractApiError } from "@/lib/errors";
import { showErrorToast } from "@/lib/toast";
import { PAGE_SIZE } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth";
import type { Role, User } from "@/types";
import type { Major } from "@/types/domain";

const EMPTY_CREATE: UserCreateInput = {
  username: "",
  password: "",
  email: "",
  full_name: "",
  role: "STUDENT",
  phone: "",
  student_major: null,
  teacher_department: "",
};

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "STUDENT", label: "Sinh viên" },
  { value: "TEACHER", label: "Giáo viên" },
];

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Quản trị viên",
  STUDENT: "Sinh viên",
  TEACHER: "Giáo viên",
};

const ROLE_TONES: Record<Role, "accent" | "neutral" | "success"> = {
  ADMIN: "accent",
  TEACHER: "success",
  STUDENT: "neutral",
};

export default function AccountsPage() {
  const me = useAuthStore((s) => s.user);

  const [items, setItems] = useState<User[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filterRole, setFilterRole] = useState<Role | "">("");
  const [filterLocked, setFilterLocked] = useState<"" | "true" | "false">("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterMajor, setFilterMajor] = useState<number | "">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserCreateInput>(EMPTY_CREATE);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [togglingLock, setTogglingLock] = useState<number | null>(null);

  // Unique department names từ Major.department — dùng cho dropdown khoa GV
  const departments = useMemo(() => {
    const set = new Set(majors.map((m) => m.department.trim()).filter(Boolean));
    // Khi edit user có department không có trong list (vd. khoa cũ), thêm vào để giữ value
    if (form.teacher_department && !set.has(form.teacher_department)) {
      set.add(form.teacher_department);
    }
    return Array.from(set).sort();
  }, [majors, form.teacher_department]);

  const filteredMajors = useMemo(
    () =>
      filterDepartment
        ? majors.filter((m) => m.department === filterDepartment)
        : majors,
    [filterDepartment, majors],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof listUsers>[0] = { page };
      if (appliedSearch) params.search = appliedSearch;
      if (filterRole) params.role = filterRole;
      if (filterLocked) params.is_locked = filterLocked === "true";
      if (filterDepartment) params.department = filterDepartment;
      if (filterMajor) params.major = filterMajor;
      const data = await listUsers(params);
      setItems(data.results);
      setTotal(data.count);
    } catch (err) {
      setError(extractApiError(err, "Không tải được danh sách tài khoản."));
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, filterDepartment, filterMajor, filterRole, filterLocked, page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    let active = true;
    listMajors({ page_size: 1000 })
      .then((data) => {
        if (active) setMajors(data.results);
      })
      .catch(() => {
        if (active) setError("Không tải được danh sách ngành học.");
      });
    return () => {
      active = false;
    };
  }, []);

  function applyFilters() {
    setPage(1);
    setAppliedSearch(search);
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_CREATE);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({
      username: u.username,
      password: "", // không hiển thị + không gửi khi update
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      phone: u.phone,
      student_major: u.student_major,
      teacher_department: u.teacher_department,
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        // Chặn đổi role ADMIN ở UI
        if (form.role === "ADMIN") {
          setFormError("Không được phép gán role ADMIN qua giao diện.");
          setSubmitting(false);
          return;
        }
        await updateUser(editing.id, {
          email: form.email,
          full_name: form.full_name,
          role: form.role,
          phone: form.phone,
          student_major: form.student_major,
          teacher_department: form.teacher_department,
        });
      } else {
        await createUser(form);
      }
      setShowForm(false);
      await refresh();
    } catch (err) {
      const message = extractApiError(err);
      setFormError(message);
      showErrorToast(message, "Không lưu được tài khoản");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleLock(u: User) {
    if (u.id === me?.id) {
      setError("Không thể tự khoá tài khoản của chính bạn.");
      return;
    }
    setTogglingLock(u.id);
    try {
      await updateUser(u.id, { is_locked: !u.is_locked });
      await refresh();
    } catch (err) {
      setError(extractApiError(err, "Không đổi được trạng thái khoá."));
    } finally {
      setTogglingLock(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      setError(extractApiError(err, "Không xoá được tài khoản."));
      setDeleteTarget(null);
    }
  }

  const columns: Column<User>[] = [
    {
      key: "username",
      label: "Tài khoản",
      mono: true,
      width: "150px",
      render: (u) => (
        <div className="flex items-center gap-1">
          <span>{u.username}</span>
          {u.id === me?.id && <Badge tone="accent">Bạn</Badge>}
        </div>
      ),
    },
    {
      key: "full_name",
      label: "Họ tên",
      render: (u) => u.full_name || <span className="text-ink-faint">—</span>,
    },
    {
      key: "email",
      label: "Email",
      render: (u) => u.email || <span className="text-ink-faint">—</span>,
    },
    {
      key: "role",
      label: "Vai trò",
      width: "130px",
      render: (u) => <Badge tone={ROLE_TONES[u.role]}>{ROLE_LABELS[u.role]}</Badge>,
    },
    {
      key: "phone",
      label: "SĐT",
      width: "120px",
      render: (u) =>
        u.phone ? (
          <span className="font-mono text-[12.5px]">{u.phone}</span>
        ) : (
          <span className="text-ink-faint">—</span>
        ),
    },
    {
      key: "status",
      label: "Trạng thái",
      width: "140px",
      render: (u) => {
        if (!u.is_active) return <Badge tone="neutral">Vô hiệu</Badge>;
        if (u.is_locked) return <Badge tone="danger">Đã khoá</Badge>;
        return <Badge tone="success">Đang hoạt động</Badge>;
      },
    },
    {
      key: "actions",
      label: "",
      width: "240px",
      align: "right",
      render: (u) => {
        const isSelf = u.id === me?.id;
        const isAdmin = u.role === "ADMIN";
        return (
          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              icon={u.is_locked ? "check" : "lock"}
              onClick={() => handleToggleLock(u)}
              disabled={togglingLock === u.id || isSelf}
              title={isSelf ? "Không thể khoá chính mình" : ""}
            >
              {u.is_locked ? "Mở" : "Khoá"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon="edit"
              onClick={() => openEdit(u)}
              disabled={isAdmin && !isSelf}
              title={isAdmin && !isSelf ? "Không sửa tài khoản Admin khác" : ""}
            >
              Sửa
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon="trash"
              onClick={() => setDeleteTarget(u)}
              disabled={isSelf || isAdmin}
              title={
                isSelf
                  ? "Không thể xoá chính mình"
                  : isAdmin
                  ? "Không xoá tài khoản Admin"
                  : ""
              }
            >
              Xoá
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
            Quản lý tài khoản
          </h1>
        </div>
        <Button variant="primary" icon="plus" onClick={openCreate}>
          Thêm tài khoản
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface border border-line w-72">
            <Icon name="search" size={15} className="text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters();
              }}
              placeholder="Tìm theo username / email / họ tên…"
              className="flex-1 bg-transparent outline-none text-[13px] min-w-0"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value as Role | "");
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-md bg-surface border border-line text-[13px]"
          >
            <option value="">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="TEACHER">Giáo viên</option>
            <option value="STUDENT">Sinh viên</option>
          </select>
          <select
            value={filterLocked}
            onChange={(e) => {
              setFilterLocked(e.target.value as "" | "true" | "false");
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-md bg-surface border border-line text-[13px]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="false">Đang hoạt động</option>
            <option value="true">Đã khoá</option>
          </select>
          <select
            value={filterDepartment}
            onChange={(e) => {
              setFilterDepartment(e.target.value);
              setFilterMajor("");
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-md bg-surface border border-line text-[13px]"
          >
            <option value="">Tất cả khoa</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <select
            value={filterMajor}
            onChange={(e) => {
              setFilterMajor(e.target.value === "" ? "" : Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-md bg-surface border border-line text-[13px] max-w-[220px]"
          >
            <option value="">Tất cả ngành</option>
            {filteredMajors.map((major) => (
              <option key={major.id} value={major.id}>
                {major.code} - {major.name}
              </option>
            ))}
          </select>
          <Button onClick={applyFilters}>Tìm</Button>
          {(appliedSearch || filterRole || filterLocked || filterDepartment || filterMajor) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setAppliedSearch("");
                setFilterRole("");
                setFilterLocked("");
                setFilterDepartment("");
                setFilterMajor("");
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
          rowKey={(u) => u.id}
          loading={loading}
          emptyText="Chưa có tài khoản nào khớp."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      </Card>

      {/* Form modal */}
      <Modal
        open={showForm}
        title={editing ? `Sửa tài khoản: ${editing.username}` : "Thêm tài khoản"}
        subtitle={
          editing
            ? "Không đổi được username và mật khẩu ở đây"
            : "Chỉ tạo được role Sinh viên hoặc Giáo viên"
        }
        onClose={() => setShowForm(false)}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Huỷ
            </Button>
            <Button variant="primary" type="submit" form="user-form" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <div className="col-span-1">
            <Label>Tên đăng nhập *</Label>
            <input
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              disabled={!!editing}
              placeholder="sv001"
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] font-mono focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none disabled:bg-surface disabled:text-ink-muted"
            />
          </div>
          <div className="col-span-1">
            <Label>Vai trò *</Label>
            <select
              required
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value as Role,
                  student_major: e.target.value === "STUDENT" ? form.student_major : null,
                  teacher_department: e.target.value === "TEACHER" ? form.teacher_department : "",
                })
              }
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
              {editing?.role === "ADMIN" && (
                <option value="ADMIN" disabled>
                  Quản trị viên (không đổi được qua đây)
                </option>
              )}
            </select>
          </div>
          {!editing && (
            <div className="col-span-2">
              <Label>Mật khẩu *</Label>
              <input
                required
                type="password"
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
              />
              <div className="text-[11.5px] text-ink-faint mt-1">
                Hash bằng PBKDF2-SHA256 (Django default). Mật khẩu plaintext không lưu vào DB.
              </div>
            </div>
          )}
          {form.role === "STUDENT" && (
            <div className="col-span-2">
              <Label>Ngành học *</Label>
              <select
                required
                value={form.student_major ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    student_major: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
              >
                <option value="">Chọn ngành học</option>
                {majors.map((major) => (
                  <option key={major.id} value={major.id}>
                    {major.code} - {major.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {form.role === "TEACHER" && (
            <div className="col-span-2">
              <Label>Khoa *</Label>
              <select
                required
                value={form.teacher_department}
                onChange={(e) => setForm({ ...form, teacher_department: e.target.value })}
                className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
              >
                <option value="">— Chọn khoa —</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="col-span-2">
            <Label>Họ và tên</Label>
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Nguyễn Văn An"
              maxLength={200}
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div>
            <Label>Email</Label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="user@dkmh.edu"
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          <div>
            <Label>Số điện thoại</Label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="0901234567"
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            />
          </div>
          {formError && (
            <div className="col-span-2 text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {formError}
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        title="Xác nhận xoá tài khoản"
        subtitle={
          deleteTarget
            ? `${deleteTarget.username} (${ROLE_LABELS[deleteTarget.role]})`
            : ""
        }
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
          Xoá tài khoản này sẽ xoá luôn hồ sơ liên kết (StudentProfile / TeacherProfile). Nếu có
          đăng ký môn / điểm số / lớp phụ trách, hệ thống có thể chặn xoá. Khuyến nghị dùng nút{" "}
          <strong>Khoá</strong> để ẩn tài khoản thay vì xoá.
        </p>
      </Modal>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[12.5px] font-medium text-ink mb-1.5">{children}</div>;
}
