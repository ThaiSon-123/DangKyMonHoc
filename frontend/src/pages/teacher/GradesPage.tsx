import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge, Button, Card, Stat, Table, type Column } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import { listClassSections } from "@/api/classes";
import { getMyTeacherProfile } from "@/api/teachers";
import { listRegistrations, type Registration } from "@/api/registrations";
import { createGrade, listGrades, updateGrade, type Grade } from "@/api/grades";
import { extractApiError } from "@/lib/errors";
import type { ClassSection } from "@/types/domain";

interface GradeRow {
  registration_id: number;
  student_code: string;
  student_name: string;
  grade_id?: number;
  process_score: string;
  midterm_score: string;
  final_score: string;
  total_score: string | null;
  gpa_4: string | null;
  grade_letter: string;
  note: string;
  dirty: boolean;
  saving: boolean;
  error: string | null;
}

function calcTotal(p: string, m: string, f: string): number | null {
  const np = parseFloat(p);
  const nm = parseFloat(m);
  const nf = parseFloat(f);
  if ([np, nm, nf].some((x) => Number.isNaN(x))) return null;
  return Number((np * 0.1 + nm * 0.4 + nf * 0.5).toFixed(2));
}

function calcLetter(total: number | null): string {
  if (total === null) return "";
  if (total >= 8.5) return "A";
  if (total >= 8.0) return "B+";
  if (total >= 7.0) return "B";
  if (total >= 6.5) return "C+";
  if (total >= 5.5) return "C";
  if (total >= 5.0) return "D+";
  if (total >= 4.0) return "D";
  return "F";
}

// Mirror backend Grade.compute_gpa_4 (apps/grades/models.py) để preview live khi chỉnh điểm
function calcGpa(total: number | null): string | null {
  if (total === null) return null;
  if (total >= 8.5) return "4.00";
  if (total >= 8.0) return "3.50";
  if (total >= 7.0) return "3.00";
  if (total >= 6.5) return "2.50";
  if (total >= 5.5) return "2.00";
  if (total >= 5.0) return "1.50";
  if (total >= 4.0) return "1.00";
  return "0.00";
}

export default function TeacherGradesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const preselectedClassId = searchParams.get("class");

  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | "">(
    preselectedClassId ? Number(preselectedClassId) : "",
  );
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load lớp phụ trách
  useEffect(() => {
    async function load() {
      try {
        const teacher = await getMyTeacherProfile();
        const data = await listClassSections({
          teacher: teacher.id,
          page_size: 1000,
        });
        setClasses(data.results);
        if (!selectedClassId && data.results.length > 0) {
          setSelectedClassId(data.results[0].id);
        }
      } catch (err) {
        setError(extractApiError(err, "Không tải được danh sách lớp."));
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load registrations + grades của lớp được chọn
  const refresh = useCallback(async () => {
    if (!selectedClassId) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [regsData, gradesData] = await Promise.all([
        listRegistrations({
          class_section: Number(selectedClassId),
          status: "CONFIRMED",
          page_size: 1000,
        }),
        listGrades({
          class_section: Number(selectedClassId),
          page_size: 1000,
        }),
      ]);
      // Map registration → grade
      const gradeMap = new Map<number, Grade>();
      for (const g of gradesData.results) {
        gradeMap.set(g.registration, g);
      }
      const newRows: GradeRow[] = regsData.results.map((reg: Registration) => {
        const g = gradeMap.get(reg.id);
        return {
          registration_id: reg.id,
          student_code: reg.student_code,
          student_name: reg.student_name || reg.student_code,
          grade_id: g?.id,
          process_score: g?.process_score ?? "",
          midterm_score: g?.midterm_score ?? "",
          final_score: g?.final_score ?? "",
          total_score: g?.total_score ?? null,
          gpa_4: g?.gpa_4 ?? null,
          grade_letter: g?.grade_letter ?? "",
          note: g?.note ?? "",
          dirty: false,
          saving: false,
          error: null,
        };
      });
      setRows(newRows);
    } catch (err) {
      setError(extractApiError(err, "Không tải được điểm."));
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function updateRow(regId: number, field: keyof GradeRow, value: string) {
    setRows((arr) =>
      arr.map((r) => {
        if (r.registration_id !== regId) return r;
        const updated = { ...r, [field]: value, dirty: true, error: null };
        // Recalc preview cho score fields
        if (["process_score", "midterm_score", "final_score"].includes(field)) {
          const total = calcTotal(
            updated.process_score,
            updated.midterm_score,
            updated.final_score,
          );
          updated.total_score = total !== null ? String(total) : null;
          updated.grade_letter = calcLetter(total);
          updated.gpa_4 = calcGpa(total);
        }
        return updated;
      }),
    );
  }

  async function saveRow(row: GradeRow) {
    setRows((arr) =>
      arr.map((r) =>
        r.registration_id === row.registration_id
          ? { ...r, saving: true, error: null }
          : r,
      ),
    );
    try {
      const payload = {
        registration: row.registration_id,
        process_score: row.process_score === "" ? null : row.process_score,
        midterm_score: row.midterm_score === "" ? null : row.midterm_score,
        final_score: row.final_score === "" ? null : row.final_score,
        note: row.note,
      };
      let result: Grade;
      if (row.grade_id) {
        result = await updateGrade(row.grade_id, payload);
      } else {
        result = await createGrade(payload);
      }
      setRows((arr) =>
        arr.map((r) =>
          r.registration_id === row.registration_id
            ? {
                ...r,
                grade_id: result.id,
                total_score: result.total_score,
                gpa_4: result.gpa_4,
                grade_letter: result.grade_letter,
                dirty: false,
                saving: false,
                error: null,
              }
            : r,
        ),
      );
    } catch (err) {
      setRows((arr) =>
        arr.map((r) =>
          r.registration_id === row.registration_id
            ? { ...r, saving: false, error: extractApiError(err) }
            : r,
        ),
      );
    }
  }

  async function saveAll() {
    const dirtyRows = rows.filter((r) => r.dirty);
    for (const row of dirtyRows) {
      await saveRow(row);
    }
  }

  const dirtyCount = rows.filter((r) => r.dirty).length;
  const gradedCount = rows.filter((r) => r.total_score !== null).length;
  const passedCount = rows.filter((r) => {
    const t = parseFloat(r.total_score ?? "");
    return !Number.isNaN(t) && t >= 4;
  }).length;
  const avgGpa = useMemo(() => {
    const grades = rows.map((r) => parseFloat(r.gpa_4 ?? "")).filter((x) => !Number.isNaN(x));
    if (grades.length === 0) return "—";
    return (grades.reduce((s, x) => s + x, 0) / grades.length).toFixed(2);
  }, [rows]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const columns: Column<GradeRow>[] = [
    { key: "student_code", label: "MSSV", mono: true, width: "120px" },
    { key: "student_name", label: "Họ tên" },
    {
      key: "process_score",
      label: "QT (10%)",
      width: "100px",
      render: (r) => (
        <input
          type="number"
          min={0}
          max={10}
          step={0.1}
          value={r.process_score}
          onChange={(e) => updateRow(r.registration_id, "process_score", e.target.value)}
          className="w-full px-2 py-1 rounded bg-card border border-line text-[13px] font-mono text-center focus:border-navy-400 focus:ring-1 focus:ring-navy-50 outline-none"
        />
      ),
    },
    {
      key: "midterm_score",
      label: "GK (40%)",
      width: "100px",
      render: (r) => (
        <input
          type="number"
          min={0}
          max={10}
          step={0.1}
          value={r.midterm_score}
          onChange={(e) => updateRow(r.registration_id, "midterm_score", e.target.value)}
          className="w-full px-2 py-1 rounded bg-card border border-line text-[13px] font-mono text-center focus:border-navy-400 focus:ring-1 focus:ring-navy-50 outline-none"
        />
      ),
    },
    {
      key: "final_score",
      label: "CK (50%)",
      width: "100px",
      render: (r) => (
        <input
          type="number"
          min={0}
          max={10}
          step={0.1}
          value={r.final_score}
          onChange={(e) => updateRow(r.registration_id, "final_score", e.target.value)}
          className="w-full px-2 py-1 rounded bg-card border border-line text-[13px] font-mono text-center focus:border-navy-400 focus:ring-1 focus:ring-navy-50 outline-none"
        />
      ),
    },
    {
      key: "total_score",
      label: "Tổng kết",
      width: "90px",
      align: "center",
      render: (r) => (
        <span className="font-mono font-semibold text-[13px]">
          {r.total_score ?? <span className="text-ink-faint">—</span>}
        </span>
      ),
    },
    {
      key: "grade_letter",
      label: "Điểm chữ",
      width: "80px",
      align: "center",
      render: (r) => {
        if (!r.grade_letter) return <span className="text-ink-faint">—</span>;
        const tone =
          r.grade_letter === "A"
            ? "success"
            : r.grade_letter === "F"
            ? "danger"
            : r.grade_letter === "D"
            ? "warn"
            : "accent";
        return <Badge tone={tone}>{r.grade_letter}</Badge>;
      },
    },
    {
      key: "gpa_4",
      label: "GPA 4",
      width: "70px",
      align: "center",
      render: (r) => (
        <span className="font-mono text-[12.5px]">
          {r.gpa_4 ?? <span className="text-ink-faint">—</span>}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "130px",
      align: "right",
      render: (r) => (
        <div className="flex flex-col gap-1 items-end">
          {r.error ? (
            <span className="text-[11px] text-danger" title={r.error}>
              {r.error.length > 30 ? r.error.slice(0, 30) + "…" : r.error}
            </span>
          ) : r.dirty ? (
            <Button
              size="sm"
              variant="primary"
              icon="check"
              onClick={() => saveRow(r)}
              disabled={r.saving}
            >
              {r.saving ? "..." : "Lưu"}
            </Button>
          ) : r.grade_id ? (
            <Badge tone="success">Đã lưu</Badge>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">Nhập điểm</h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            Công thức: <strong>Tổng = QT × 10% + GK × 40% + CK × 50%</strong> (BR-009). Điểm chữ
            và GPA-4 tự tính. Phải nhập trong vòng 2 tuần sau kết thúc môn (BR-008).
          </p>
        </div>
        <select
          value={selectedClassId}
          onChange={(e) => {
            const v = e.target.value === "" ? "" : Number(e.target.value);
            setSelectedClassId(v);
            if (v) setSearchParams({ class: String(v) });
            else setSearchParams({});
          }}
          className="px-3 py-2 rounded-md bg-card border border-line text-[13px] min-w-[300px]"
        >
          <option value="">— Chọn lớp —</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} · {c.course_code} - {c.course_name}
            </option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat
            label="Sĩ số"
            value={rows.length}
            hint={`tối đa ${selectedClass.max_students}`}
            icon="users"
            tone="accent"
          />
          <Stat
            label="Đã nhập điểm"
            value={gradedCount}
            hint={`${rows.length - gradedCount} chưa nhập`}
            icon="check"
          />
          <Stat
            label="Đạt (≥ 4)"
            value={passedCount}
            hint={`${gradedCount - passedCount} không đạt`}
            icon="chart"
          />
          <Stat label="GPA TB lớp" value={avgGpa} hint="thang 4" icon="graduation" />
        </div>
      )}

      {error && (
        <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <Card
        title={selectedClass ? `${selectedClass.code} - ${selectedClass.course_name}` : "Chọn lớp"}
        subtitle={
          selectedClass
            ? `${rows.length} sinh viên · HK ${selectedClass.semester_code}`
            : "Chọn lớp ở dropdown trên để bắt đầu nhập điểm"
        }
        action={
          dirtyCount > 0 && (
            <Button variant="primary" icon="check" onClick={saveAll}>
              Lưu tất cả ({dirtyCount})
            </Button>
          )
        }
      >
        {!selectedClassId ? (
          <div className="py-10 text-center text-ink-faint">
            Chưa chọn lớp.
          </div>
        ) : loading ? (
          <div className="py-10 text-center text-ink-muted">Đang tải...</div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-14 h-14 rounded-xl bg-surface text-ink-faint grid place-items-center mx-auto mb-3">
              <Icon name="users" size={28} />
            </div>
            <div className="text-[15px] font-semibold text-ink mb-1">
              Lớp chưa có sinh viên
            </div>
            <p className="text-[13px] text-ink-muted">
              Sinh viên cần đăng ký và được duyệt mới hiện ở đây.
            </p>
          </div>
        ) : (
          <Table
            columns={columns}
            rows={rows}
            rowKey={(r) => r.registration_id}
            emptyText=""
          />
        )}
      </Card>

      <p className="text-[11.5px] text-ink-faint">
        Lưu ý: hệ thống tự tính Tổng + Điểm chữ + GPA khi backend save. Nếu một trong 3 điểm
        thành phần trống, các giá trị tổng kết sẽ là <code>null</code>.
      </p>
    </div>
  );
}
