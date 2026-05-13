import { Card, Stat, Badge, Button } from "@/components/ui";
import Icon from "@/components/ui/Icon";

export default function StudentDashboard() {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
            Chào buổi sáng
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            Bạn còn 5 ngày để hoàn tất đăng ký môn học kỳ 2 · 2025–2026.
          </p>
        </div>
        <div className="flex gap-2">
          <Button icon="calendar">Xem TKB</Button>
          <Button variant="primary" icon="sparkle">
            Tạo TKB tự động
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Tín chỉ kỳ này" value="18" hint="tối đa 24" icon="book" tone="accent" />
        <Stat label="Đã đăng ký" value="6 môn" hint="2 môn tự chọn" icon="doc" />
        <Stat label="GPA tích lũy" value="3.42" delta="+0.08" hint="vs kỳ trước" icon="chart" />
        <Stat label="Hoàn thành CTĐT" value="68%" hint="98 / 145 TC" icon="layers" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card
          className="lg:col-span-2"
          title="Đăng ký môn học"
          subtitle="Đợt đăng ký HK2 · 2025–2026"
          action={<Badge tone="success">Còn 5 ngày</Badge>}
        >
          <ul className="space-y-2">
            {[
              { code: "CS201", name: "Cấu trúc dữ liệu", status: "registered", room: "B4.12" },
              { code: "MA202", name: "Toán rời rạc", status: "registered", room: "A2.05" },
              { code: "EN102", name: "Tiếng Anh chuyên ngành", status: "pending", room: "—" },
              { code: "CS280", name: "Lập trình hướng đối tượng", status: "conflict", room: "B4.08" },
            ].map((c) => (
              <li
                key={c.code}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-line hover:bg-surface"
              >
                <div className="font-mono text-[12.5px] text-ink-muted w-16">{c.code}</div>
                <div className="flex-1 text-[13px] text-ink">{c.name}</div>
                <div className="text-[12px] text-ink-faint font-mono">{c.room}</div>
                {c.status === "registered" && <Badge tone="success">Đã đăng ký</Badge>}
                {c.status === "pending" && <Badge tone="warn">Chờ xác nhận</Badge>}
                {c.status === "conflict" && <Badge tone="danger">Trùng lịch</Badge>}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Thông báo mới">
          <ul className="space-y-2">
            {[
              {
                icon: "megaphone" as const,
                text: "Mở đợt đăng ký HK2 — bắt đầu từ 14/05",
                time: "2 giờ trước",
              },
              {
                icon: "calendar" as const,
                text: "Lớp CS201.02 đổi phòng từ B4.10 → B4.12",
                time: "Hôm qua",
              },
              {
                icon: "bell" as const,
                text: "Bạn vừa đăng ký thành công môn MA202",
                time: "2 ngày trước",
              },
            ].map((n, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 px-2.5 py-2 rounded-md hover:bg-surface"
              >
                <div className="w-7 h-7 rounded-md bg-navy-50 text-navy-600 grid place-items-center flex-shrink-0 mt-px">
                  <Icon name={n.icon} size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] text-ink">{n.text}</div>
                  <div className="text-[11px] text-ink-faint mt-0.5">{n.time}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <p className="text-[11.5px] text-ink-faint">
        Dữ liệu mẫu — sẽ thay bằng API sau khi backend implement modules Đăng ký (FR-STU-REG) và
        Thông báo (FR-STU-NOT).
      </p>
    </div>
  );
}
