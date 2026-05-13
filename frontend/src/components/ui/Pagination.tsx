import Button from "./Button";

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, total, onChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  if (total === 0) return null;

  // Build danh sách số trang để hiển thị (max 7 nút):
  // [1] ... [page-1] [page] [page+1] ... [last]
  const pages: (number | "…")[] = [];
  const push = (v: number | "…") => pages.push(v);
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) push(i);
  } else {
    push(1);
    if (page > 3) push("…");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) push(i);
    if (page < totalPages - 2) push("…");
    push(totalPages);
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 pt-3">
      <div className="text-[12.5px] text-ink-muted">
        Hiển thị <span className="font-semibold text-ink">{from}</span>
        {" – "}
        <span className="font-semibold text-ink">{to}</span>
        {" / "}
        <span className="font-semibold text-ink">{total}</span>
        {" bản ghi"}
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="secondary"
          icon="chevronLeft"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
        >
          Trước
        </Button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-2 text-ink-faint">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={`min-w-[32px] h-8 px-2 rounded-md text-[13px] font-medium transition-colors ${
                p === page
                  ? "bg-navy-600 text-white"
                  : "bg-card text-ink border border-line hover:bg-surface"
              }`}
            >
              {p}
            </button>
          ),
        )}
        <Button
          size="sm"
          variant="secondary"
          iconRight="chevronRight"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}
