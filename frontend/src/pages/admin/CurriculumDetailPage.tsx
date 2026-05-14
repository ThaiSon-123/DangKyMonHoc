import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, Modal, Stat, Table, type Column } from "@/components/ui";
import {
  addCourseToCurriculum,
  getCurriculum,
  removeCourseFromCurriculum,
  updateCurriculumCourse,
  type CurriculumCourseInput,
} from "@/api/curriculums";
import { listCourses } from "@/api/courses";
import { extractApiError } from "@/lib/errors";
import { showErrorToast } from "@/lib/toast";
import { semesterLabel } from "@/lib/semester";
import {
  KNOWLEDGE_BLOCK_LABELS,
  type Course,
  type Curriculum,
  type CurriculumCourse,
  type KnowledgeBlock,
} from "@/types/domain";

const EMPTY: CurriculumCourseInput = {
  curriculum: 0,
  course: 0,
  knowledge_block: "MAJOR",
  is_required: true,
  suggested_semester: 1,
};

export default function CurriculumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const curriculumId = Number(id);

  const [data, setData] = useState<Curriculum | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<CurriculumCourse | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CurriculumCourseInput>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<CurriculumCourse | null>(null);

  const refresh = useCallback(async () => {
    if (!curriculumId) return;
    setLoading(true);
    setError(null);
    try {
      const d = await getCurriculum(curriculumId);
      setData(d);
    } catch (err) {
      setError(extractApiError(err, "Không tải được CTĐT."));
    } finally {
      setLoading(false);
    }
  }, [curriculumId]);

  useEffect(() => {
    refresh();
    // Fetch tất cả courses (page_size lớn) để dropdown đầy đủ trong modal Thêm
    listCourses({ page_size: 1000 }).then((r) => setAllCourses(r.results));
  }, [refresh]);

  // ID môn đã có trong CTĐT — để filter khỏi dropdown khi thêm mới
  const existingCourseIds = useMemo(
    () => new Set(data?.curriculum_courses.map((cc) => cc.course) ?? []),
    [data],
  );

  // Stats
  const stats = useMemo(() => {
    if (!data) return null;
    const cs = data.curriculum_courses;
    const totalCredits = cs.reduce((s, cc) => s + cc.course_credits, 0);
    const required = cs.filter((cc) => cc.is_required).length;
    const optional = cs.length - required;
    const maxSem = cs.reduce((m, cc) => Math.max(m, cc.suggested_semester), 0);
    return { count: cs.length, totalCredits, required, optional, maxSem };
  }, [data]);

  // Group theo HK
  const grouped = useMemo(() => {
    const map = new Map<number, CurriculumCourse[]>();
    for (const cc of data?.curriculum_courses ?? []) {
      const arr = map.get(cc.suggested_semester) ?? [];
      arr.push(cc);
      map.set(cc.suggested_semester, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [data]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY, curriculum: curriculumId });
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(cc: CurriculumCourse) {
    setEditing(cc);
    setForm({
      curriculum: cc.curriculum,
      course: cc.course,
      knowledge_block: cc.knowledge_block,
      is_required: cc.is_required,
      suggested_semester: cc.suggested_semester,
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
        await updateCurriculumCourse(editing.id, form);
      } else {
        await addCourseToCurriculum(form);
      }
      setShowForm(false);
      await refresh();
    } catch (err) {
      const message = extractApiError(err);
      setFormError(message);
      showErrorToast(message, "Không lưu được môn trong CTĐT");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await removeCourseFromCurriculum(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      setError(extractApiError(err, "Không gỡ được môn khỏi CTĐT."));
      setDeleteTarget(null);
    }
  }

  if (loading && !data) {
    return <div className="text-ink-muted">Đang tải...</div>;
  }

  if (!data) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-danger">{error || "Không tìm thấy CTĐT."}</div>
        <Link to="/admin/curriculum" className="text-navy-600 text-sm">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  const courseColumns: Column<CurriculumCourse>[] = [
    { key: "course_code", label: "Mã môn", mono: true, width: "100px" },
    { key: "course_name", label: "Tên môn" },
    {
      key: "course_credits",
      label: "TC",
      align: "center",
      width: "60px",
      render: (cc) => <span className="font-mono">{cc.course_credits}</span>,
    },
    {
      key: "knowledge_block",
      label: "Khối kiến thức",
      width: "140px",
      render: (cc) => <Badge tone="accent">{cc.knowledge_block_display}</Badge>,
    },
    {
      key: "is_required",
      label: "Bắt buộc",
      width: "100px",
      align: "center",
      render: (cc) =>
        cc.is_required ? (
          <Badge tone="success">Bắt buộc</Badge>
        ) : (
          <Badge tone="neutral">Tự chọn</Badge>
        ),
    },
    {
      key: "actions",
      label: "",
      width: "150px",
      align: "right",
      render: (cc) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" icon="edit" onClick={() => openEdit(cc)}>
            Sửa
          </Button>
          <Button size="sm" variant="ghost" icon="trash" onClick={() => setDeleteTarget(cc)}>
            Gỡ
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <Link to="/admin/curriculum" className="text-[12.5px] text-navy-600 hover:underline">
          ← Danh sách CTĐT
        </Link>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[13px] text-ink-muted">{data.code}</span>
            {data.is_active ? (
              <Badge tone="success">Đang dùng</Badge>
            ) : (
              <Badge tone="neutral">Ngừng</Badge>
            )}
          </div>
          <h1 className="m-0 mt-1 text-[22px] font-semibold tracking-tight text-ink">
            {data.name}
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            Ngành <span className="font-mono">{data.major_code}</span> · Khóa{" "}
            <span className="font-mono">{data.cohort_year}</span> · Yêu cầu{" "}
            <span className="font-semibold">{data.total_credits_required}</span> tín chỉ
          </p>
          {data.description && (
            <p className="mt-2 text-[13px] text-ink-muted max-w-prose">{data.description}</p>
          )}
        </div>
        <Button variant="primary" icon="plus" onClick={openCreate}>
          Thêm môn vào CTĐT
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Tổng môn" value={stats.count} icon="book" tone="accent" />
          <Stat
            label="Tổng tín chỉ"
            value={stats.totalCredits}
            hint={`/ ${data.total_credits_required} yêu cầu`}
            icon="layers"
          />
          <Stat
            label="Môn bắt buộc"
            value={stats.required}
            hint={`${stats.optional} tự chọn`}
            icon="clipboard"
          />
          <Stat label="Số học kỳ" value={stats.maxSem} icon="calendar" />
        </div>
      )}

      {error && (
        <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {grouped.length === 0 ? (
        <Card>
          <div className="py-10 text-center text-ink-faint">
            CTĐT này chưa có môn nào. Bấm <strong className="text-ink">Thêm môn vào CTĐT</strong>{" "}
            để bắt đầu.
          </div>
        </Card>
      ) : (
        grouped.map(([sem, courses]) => {
          const semCredits = courses.reduce((s, cc) => s + cc.course_credits, 0);
          return (
            <Card
              key={sem}
              title={semesterLabel(sem, data.cohort_year)}
              subtitle={`${courses.length} môn · ${semCredits} tín chỉ`}
            >
              <Table
                columns={courseColumns}
                rows={courses}
                rowKey={(cc) => cc.id}
                emptyText=""
              />
            </Card>
          );
        })
      )}

      {/* Form modal: add / edit curriculum-course */}
      <Modal
        open={showForm}
        title={editing ? `Sửa môn trong CTĐT` : "Thêm môn vào CTĐT"}
        subtitle={
          editing ? `${editing.course_code} - ${editing.course_name}` : "Chọn 1 môn từ danh sách"
        }
        onClose={() => setShowForm(false)}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Huỷ
            </Button>
            <Button variant="primary" type="submit" form="cc-form" disabled={submitting}>
              {submitting ? "Đang lưu..." : editing ? "Lưu" : "Thêm"}
            </Button>
          </>
        }
      >
        <form id="cc-form" onSubmit={handleSubmit} className="space-y-3">
          {!editing && (
            <label className="block">
              <div className="text-[12.5px] font-medium text-ink mb-1.5">Môn học *</div>
              <select
                required
                value={form.course}
                onChange={(e) => setForm({ ...form, course: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
              >
                <option value={0}>-- chọn môn --</option>
                {allCourses
                  .filter((c) => !existingCourseIds.has(c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} · {c.name} ({c.credits} TC)
                    </option>
                  ))}
              </select>
              {allCourses.filter((c) => !existingCourseIds.has(c.id)).length === 0 && (
                <div className="text-[11.5px] text-ink-faint mt-1">
                  Tất cả môn đã có trong CTĐT này. Tạo môn mới ở{" "}
                  <Link to="/admin/courses" className="text-navy-600 hover:underline">
                    /admin/courses
                  </Link>{" "}
                  trước.
                </div>
              )}
            </label>
          )}

          <label className="block">
            <div className="text-[12.5px] font-medium text-ink mb-1.5">Khối kiến thức *</div>
            <select
              required
              value={form.knowledge_block}
              onChange={(e) =>
                setForm({ ...form, knowledge_block: e.target.value as KnowledgeBlock })
              }
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            >
              {Object.entries(KNOWLEDGE_BLOCK_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-[12.5px] font-medium text-ink mb-1.5">Học kỳ gợi ý *</div>
            <select
              required
              value={form.suggested_semester}
              onChange={(e) =>
                setForm({ ...form, suggested_semester: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-md bg-card border border-line text-[13px] focus:border-navy-400 focus:ring-2 focus:ring-navy-50 outline-none"
            >
              {Array.from({ length: data.total_credits_required > 100 ? 8 : 8 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {semesterLabel(n, data.cohort_year)}
                </option>
              ))}
            </select>
            <div className="text-[11.5px] text-ink-faint mt-1">
              Quy ước: 2 học kỳ chính / năm (không tính HK hè).
            </div>
          </label>

          <label className="inline-flex items-center gap-2 text-[13px] cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_required}
              onChange={(e) => setForm({ ...form, is_required: e.target.checked })}
              className="w-4 h-4 rounded border-line-strong accent-navy-600"
            />
            <span>Môn bắt buộc</span>
          </label>

          {formError && (
            <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {formError}
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        title="Xác nhận gỡ môn"
        subtitle={
          deleteTarget ? `${deleteTarget.course_code} - ${deleteTarget.course_name}` : ""
        }
        onClose={() => setDeleteTarget(null)}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Huỷ
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Gỡ
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] text-ink">
          Gỡ môn này khỏi CTĐT? Môn vẫn tồn tại trong hệ thống, chỉ là không còn nằm trong CTĐT
          này nữa.
        </p>
      </Modal>
    </div>
  );
}
