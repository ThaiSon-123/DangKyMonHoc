import { Card, Stat, Badge, Button } from "@/components/ui";
import Icon from "@/components/ui/Icon";

export default function TeacherDashboard() {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
            Tổng quan giảng dạy
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            Học kỳ 2 · 2025–2026 — 4 lớp được phân công, 12 tiết / tuần.
          </p>
        </div>
        <div className="flex gap-2">
          <Button icon="calendar">Lịch dạy</Button>
          <Button variant="primary" icon="edit">
            Nhập điểm
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Lớp phụ trách" value="4" hint="HK2 · 2025–2026" icon="clipboard" tone="accent" />
        <Stat label="Tổng sinh viên" value="186" hint="trung bình 46/lớp" icon="users" />
        <Stat label="Giờ dạy / tuần" value="12h" hint="4 buổi · 3 phòng" icon="clock" />
        <Stat label="Đã nhập điểm" value="78%" delta="+12%" hint="3 / 4 lớp" icon="chart" />
      </div>

      <Card title="Lớp phụ trách" subtitle="Học kỳ hiện tại">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              code: "CS201.01",
              name: "Cấu trúc dữ liệu",
              students: 48,
              max: 50,
              room: "B4.12",
              schedule: "Thứ 2 · 7:00 – 9:30",
            },
            {
              code: "CS201.02",
              name: "Cấu trúc dữ liệu",
              students: 50,
              max: 50,
              room: "B4.10",
              schedule: "Thứ 3 · 13:00 – 15:30",
            },
            {
              code: "CS280.01",
              name: "Lập trình hướng đối tượng",
              students: 42,
              max: 45,
              room: "B4.08",
              schedule: "Thứ 4 · 9:30 – 12:00",
            },
            {
              code: "CS280.02",
              name: "Lập trình hướng đối tượng",
              students: 46,
              max: 45,
              room: "B4.08",
              schedule: "Thứ 6 · 13:00 – 15:30",
            },
          ].map((c) => {
            const full = c.students >= c.max;
            return (
              <div
                key={c.code}
                className="border border-line rounded-lg p-3.5 hover:bg-surface cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[12.5px] text-ink-muted">{c.code}</span>
                  {full ? (
                    <Badge tone="danger">Đầy</Badge>
                  ) : (
                    <Badge tone="success">
                      {c.students}/{c.max}
                    </Badge>
                  )}
                </div>
                <div className="text-[14px] font-semibold text-ink">{c.name}</div>
                <div className="mt-2 flex items-center gap-3 text-[12px] text-ink-muted">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="calendar" size={13} />
                    {c.schedule}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="building" size={13} />
                    {c.room}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="text-[11.5px] text-ink-faint">
        Dữ liệu mẫu — sẽ thay bằng API sau khi backend implement module Lớp học phần (FR-TEA-CLS).
      </p>
    </div>
  );
}
