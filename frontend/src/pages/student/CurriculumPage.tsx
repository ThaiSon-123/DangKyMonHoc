import { useEffect, useMemo, useState } from "react";
import { Badge, Card, Stat, Table, type Column } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import { getMyCurriculum } from "@/api/curriculums";
import { extractApiError } from "@/lib/errors";
import { semesterLabel } from "@/lib/semester";
import {
  KNOWLEDGE_BLOCK_LABELS,
  type Curriculum,
  type CurriculumCourse,
  type KnowledgeBlock,
} from "@/types/domain";

const BLOCK_TONE: Record<KnowledgeBlock, "neutral" | "accent" | "success" | "warn" | "danger"> = {
  GENERAL: "neutral",
  BASIC: "accent",
  MAJOR: "success",
  ELECTIVE: "warn",
  THESIS: "danger",
};

export default function StudentCurriculumPage() {
  const [data, setData] = useState<Curriculum | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMyCurriculum()
      .then((d) => {
        if (active) setData(d);
      })
      .catch((err) => {
        if (active) setError(extractApiError(err, "Không tải được CTĐT của bạn."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;
    const cs = data.curriculum_courses;
    const totalCredits = cs.reduce((s, cc) => s + cc.course_credits, 0);
    const required = cs.filter((cc) => cc.is_required).length;
    const optional = cs.length - required;
    const requiredCredits = cs
      .filter((cc) => cc.is_required)
      .reduce((s, cc) => s + cc.course_credits, 0);
    const maxSem = cs.reduce((m, cc) => Math.max(m, cc.suggested_semester), 0);
    // Phân bố theo khối kiến thức
    const byBlock = new Map<KnowledgeBlock, { count: number; credits: number }>();
    for (const cc of cs) {
      const cur = byBlock.get(cc.knowledge_block) ?? { count: 0, credits: 0 };
      cur.count += 1;
      cur.credits += cc.course_credits;
      byBlock.set(cc.knowledge_block, cur);
    }
    return { count: cs.length, totalCredits, required, optional, requiredCredits, maxSem, byBlock };
  }, [data]);

  const grouped = useMemo(() => {
    const map = new Map<number, CurriculumCourse[]>();
    for (const cc of data?.curriculum_courses ?? []) {
      const arr = map.get(cc.suggested_semester) ?? [];
      arr.push(cc);
      map.set(cc.suggested_semester, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [data]);

  if (loading) {
    return <div className="text-ink-muted">Đang tải CTĐT...</div>;
  }

  if (error) {
    return (
      <Card>
        <div className="py-10 text-center text-ink-muted">
          <div className="w-14 h-14 rounded-xl bg-red-50 text-danger grid place-items-center mx-auto mb-3">
            <Icon name="x" size={28} />
          </div>
          <div className="text-[15px] font-semibold text-ink mb-1">Chưa có CTĐT</div>
          <p className="text-[13px] text-ink-muted max-w-md mx-auto">{error}</p>
        </div>
      </Card>
    );
  }

  if (!data || !stats) return null;

  const completionRatio =
    data.total_credits_required > 0
      ? Math.min(100, Math.round((stats.totalCredits / data.total_credits_required) * 100))
      : 0;

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
      width: "150px",
      render: (cc) => (
        <Badge tone={BLOCK_TONE[cc.knowledge_block]}>{cc.knowledge_block_display}</Badge>
      ),
    },
    {
      key: "is_required",
      label: "Loại",
      width: "110px",
      align: "center",
      render: (cc) =>
        cc.is_required ? (
          <Badge tone="success">Bắt buộc</Badge>
        ) : (
          <Badge tone="neutral">Tự chọn</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[13px] text-ink-muted">{data.code}</span>
            {data.is_active ? (
              <Badge tone="success">Đang dùng</Badge>
            ) : (
              <Badge tone="neutral">Lưu trữ</Badge>
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
      </div>

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
          icon="check"
        />
        <Stat label="Số học kỳ" value={stats.maxSem} icon="calendar" />
      </div>

      {/* Tỷ lệ hoàn thành CTĐT (theo TC) */}
      <Card title="Tổng quan CTĐT" subtitle={`Khóa ${data.cohort_year} - Ngành ${data.major_code}`}>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-[12.5px] text-ink-muted mb-1.5">
              <span>Tổng tín chỉ trong CTĐT</span>
              <span className="font-mono text-ink font-semibold">
                {stats.totalCredits} / {data.total_credits_required} TC ({completionRatio}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface overflow-hidden">
              <div
                className={`h-full ${
                  completionRatio >= 100 ? "bg-success" : "bg-navy-600"
                }`}
                style={{ width: `${completionRatio}%` }}
              />
            </div>
            {stats.totalCredits < data.total_credits_required && (
              <div className="text-[11.5px] text-warn mt-1">
                Thiếu {data.total_credits_required - stats.totalCredits} TC so với yêu cầu
              </div>
            )}
          </div>

          {/* Phân bố khối kiến thức */}
          <div>
            <div className="text-[12.5px] font-medium text-ink mb-2">Phân bố khối kiến thức</div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(Object.keys(KNOWLEDGE_BLOCK_LABELS) as KnowledgeBlock[]).map((k) => {
                const info = stats.byBlock.get(k) ?? { count: 0, credits: 0 };
                return (
                  <div key={k} className="px-3 py-2.5 rounded-md bg-surface">
                    <div className="text-[11.5px] text-ink-muted">{KNOWLEDGE_BLOCK_LABELS[k]}</div>
                    <div className="text-[18px] font-semibold text-ink mt-0.5">
                      {info.count}
                      <span className="text-[11.5px] text-ink-muted ml-1">môn</span>
                    </div>
                    <div className="text-[11px] text-ink-faint font-mono">{info.credits} TC</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Group theo học kỳ */}
      {grouped.length === 0 ? (
        <Card>
          <div className="py-10 text-center text-ink-faint">CTĐT này chưa có môn nào.</div>
        </Card>
      ) : (
        grouped.map(([sem, courses]) => {
          const semCredits = courses.reduce((s, cc) => s + cc.course_credits, 0);
          const semRequired = courses.filter((cc) => cc.is_required).length;
          return (
            <Card
              key={sem}
              title={semesterLabel(sem, data.cohort_year)}
              subtitle={`${courses.length} môn · ${semCredits} tín chỉ · ${semRequired} bắt buộc`}
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

      <p className="text-[11.5px] text-ink-faint">
        CTĐT này hiển thị dựa trên ngành và khóa của bạn trong hồ sơ sinh viên. Nếu thông tin sai,
        liên hệ phòng đào tạo để cập nhật.
      </p>
    </div>
  );
}
