import { useEffect, useMemo, useState } from "react";
import { Badge, Card, Stat, Table, type Column } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import { listGrades, type Grade } from "@/api/grades";
import { extractApiError } from "@/lib/errors";
import { showErrorToast } from "@/lib/toast";

// Letter → màu (Badge chỉ có 5 tone nên gộp B+/B, C+/C, D+/D)
const LETTER_TONE: Record<string, "neutral" | "accent" | "success" | "warn" | "danger"> = {
  A: "success",
  "B+": "accent",
  B: "accent",
  "C+": "neutral",
  C: "neutral",
  "D+": "warn",
  D: "warn",
  F: "danger",
};

interface SemesterGroup {
  code: string;
  name: string;
  grades: Grade[];
  gpa: number | null; // GPA HK weighted by credits
  totalCredits: number; // tổng TC có điểm hợp lệ
  earnedCredits: number; // TC đạt (>= D)
}

function weightedGpa(grades: Grade[]): { gpa: number | null; totalCredits: number; earnedCredits: number } {
  let sumWeighted = 0;
  let sumCredits = 0;
  let earned = 0;
  for (const g of grades) {
    if (g.gpa_4 === null || g.gpa_4 === "") continue;
    const credits = g.course_credits;
    const gpa = parseFloat(g.gpa_4);
    if (Number.isNaN(gpa)) continue;
    sumWeighted += gpa * credits;
    sumCredits += credits;
    if (gpa > 0) earned += credits;
  }
  return {
    gpa: sumCredits > 0 ? sumWeighted / sumCredits : null,
    totalCredits: sumCredits,
    earnedCredits: earned,
  };
}

export default function StudentGradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await listGrades({ page_size: 1000 });
        if (!cancelled) setGrades(data.results);
      } catch (err) {
        if (!cancelled) showErrorToast(extractApiError(err, "Không tải được bảng điểm."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Group theo semester_code, sort giảm dần (HK mới nhất trên cùng)
  const groups: SemesterGroup[] = useMemo(() => {
    const byCode = new Map<string, Grade[]>();
    const nameByCode = new Map<string, string>();
    for (const g of grades) {
      if (!byCode.has(g.semester_code)) byCode.set(g.semester_code, []);
      byCode.get(g.semester_code)!.push(g);
      nameByCode.set(g.semester_code, g.semester_name);
    }
    const result: SemesterGroup[] = [];
    for (const [code, list] of byCode.entries()) {
      const w = weightedGpa(list);
      // Sort trong nhóm: theo course_code asc
      list.sort((a, b) => a.course_code.localeCompare(b.course_code));
      result.push({
        code,
        name: nameByCode.get(code) ?? "",
        grades: list,
        gpa: w.gpa,
        totalCredits: w.totalCredits,
        earnedCredits: w.earnedCredits,
      });
    }
    result.sort((a, b) => b.code.localeCompare(a.code));
    return result;
  }, [grades]);

  // KPI tổng
  const totals = useMemo(() => weightedGpa(grades), [grades]);
  const passedCount = grades.filter(
    (g) => g.gpa_4 !== null && g.gpa_4 !== "" && parseFloat(g.gpa_4) > 0,
  ).length;
  const failedCount = grades.filter(
    (g) => g.gpa_4 !== null && g.gpa_4 !== "" && parseFloat(g.gpa_4) === 0,
  ).length;
  const pendingCount = grades.filter((g) => g.gpa_4 === null || g.gpa_4 === "").length;

  function buildColumns(): Column<Grade>[] {
    return [
      {
        key: "course_code",
        label: "Mã môn",
        mono: true,
        width: "100px",
      },
      {
        key: "course_name",
        label: "Tên môn",
        render: (g) => (
          <div>
            <div className="text-[13px]">{g.course_name}</div>
            <div className="font-mono text-[11.5px] text-ink-faint">{g.class_section_code}</div>
          </div>
        ),
      },
      {
        key: "course_credits",
        label: "TC",
        align: "center",
        width: "55px",
        render: (g) => <span className="font-mono">{g.course_credits}</span>,
      },
      {
        key: "process_score",
        label: "QT",
        align: "center",
        width: "60px",
        render: (g) => (
          <span className="font-mono text-[12.5px]">
            {g.process_score ?? <span className="text-ink-faint">—</span>}
          </span>
        ),
      },
      {
        key: "midterm_score",
        label: "GK",
        align: "center",
        width: "60px",
        render: (g) => (
          <span className="font-mono text-[12.5px]">
            {g.midterm_score ?? <span className="text-ink-faint">—</span>}
          </span>
        ),
      },
      {
        key: "final_score",
        label: "CK",
        align: "center",
        width: "60px",
        render: (g) => (
          <span className="font-mono text-[12.5px]">
            {g.final_score ?? <span className="text-ink-faint">—</span>}
          </span>
        ),
      },
      {
        key: "total_score",
        label: "Tổng",
        align: "center",
        width: "70px",
        render: (g) => (
          <span className="font-mono font-semibold text-[13px]">
            {g.total_score ?? <span className="text-ink-faint">—</span>}
          </span>
        ),
      },
      {
        key: "grade_letter",
        label: "Chữ",
        align: "center",
        width: "65px",
        render: (g) => {
          if (!g.grade_letter) return <span className="text-ink-faint">—</span>;
          return <Badge tone={LETTER_TONE[g.grade_letter] ?? "neutral"}>{g.grade_letter}</Badge>;
        },
      },
      {
        key: "gpa_4",
        label: "GPA-4",
        align: "center",
        width: "70px",
        render: (g) => (
          <span className="font-mono text-[12.5px]">
            {g.gpa_4 ?? <span className="text-ink-faint">—</span>}
          </span>
        ),
      },
    ];
  }

  const columns = buildColumns();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">Bảng điểm</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="GPA tích lũy"
          value={totals.gpa !== null ? totals.gpa.toFixed(2) : "—"}
          hint="thang 4, theo TC"
          icon="graduation"
          tone="accent"
        />
        <Stat
          label="TC tích lũy"
          value={totals.earnedCredits}
          hint={`tổng ${totals.totalCredits} TC đã có điểm`}
          icon="book"
        />
        <Stat
          label="Môn đã đạt"
          value={passedCount}
          hint={`${failedCount} môn rớt`}
          icon="check"
        />
        <Stat
          label="Chờ điểm"
          value={pendingCount}
          hint="chưa có điểm tổng kết"
          icon="clock"
        />
      </div>

      {loading ? (
        <div className="text-ink-muted">Đang tải...</div>
      ) : groups.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-xl bg-surface text-ink-faint grid place-items-center mx-auto mb-3">
              <Icon name="graduation" size={28} />
            </div>
            <div className="text-[15px] font-semibold text-ink">Chưa có điểm nào</div>
            <p className="text-[13px] text-ink-muted mt-1">
              Điểm sẽ xuất hiện sau khi giáo viên nhập kết quả cho lớp bạn đã đăng ký.
            </p>
          </div>
        </Card>
      ) : (
        groups.map((g) => (
          <Card
            key={g.code}
            title={`${g.code} ${g.name ? `– ${g.name}` : ""}`}
            subtitle={
              <span className="flex items-center gap-3 text-[12.5px]">
                <span>
                  GPA HK:{" "}
                  <strong className="font-mono text-ink">
                    {g.gpa !== null ? g.gpa.toFixed(2) : "—"}
                  </strong>
                </span>
                <span className="text-ink-faint">·</span>
                <span>{g.grades.length} môn</span>
                <span className="text-ink-faint">·</span>
                <span>
                  {g.earnedCredits}/{g.totalCredits} TC đạt
                </span>
              </span>
            }
          >
            <Table columns={columns} rows={g.grades} rowKey={(r) => r.id} emptyText="" />
          </Card>
        ))
      )}
    </div>
  );
}
