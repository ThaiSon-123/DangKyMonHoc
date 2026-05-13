import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T, index: number) => ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
  mono?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  emptyText?: string;
  loading?: boolean;
}

export default function Table<T>({
  columns,
  rows,
  rowKey,
  emptyText = "Không có dữ liệu.",
  loading = false,
}: Props<T>) {
  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className="px-3.5 py-2.5 text-[11.5px] font-semibold text-ink-muted uppercase tracking-wider border-b border-line bg-cardAlt whitespace-nowrap"
                style={{
                  textAlign: c.align ?? "left",
                  width: c.width,
                }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3.5 py-10 text-center text-ink-muted"
              >
                Đang tải...
              </td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3.5 py-10 text-center text-ink-faint"
              >
                {emptyText}
              </td>
            </tr>
          )}
          {!loading &&
            rows.map((row, idx) => (
              <tr key={rowKey(row)} className="hover:bg-surface/60">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-3.5 py-2.5 border-b border-line align-middle ${
                      c.mono ? "font-mono text-[12.5px]" : ""
                    }`}
                    style={{ textAlign: c.align ?? "left" }}
                  >
                    {c.render ? c.render(row, idx) : (row as Record<string, ReactNode>)[c.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
