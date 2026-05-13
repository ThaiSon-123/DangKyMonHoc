import { Card, Stat, Badge, Button } from "@/components/ui";
import Icon from "@/components/ui/Icon";

export default function AdminDashboard() {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
            Tổng quan vận hành
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            Bức tranh nhanh về đăng ký môn học, lớp học phần và tài khoản người dùng.
          </p>
        </div>
        <div className="flex gap-2">
          <Button icon="download">Xuất báo cáo</Button>
          <Button variant="primary" icon="plus">
            Mở đợt đăng ký
          </Button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Sinh viên"
          value="12,840"
          delta="+128"
          hint="vs học kỳ trước"
          icon="users"
          tone="accent"
        />
        <Stat
          label="Lớp học phần"
          value="486"
          delta="+12"
          hint="kỳ 2 / 2025–2026"
          icon="clipboard"
        />
        <Stat
          label="Đăng ký"
          value="48,210"
          delta="+18.4%"
          hint="lũy kế kỳ này"
          icon="doc"
        />
        <Stat
          label="Uptime"
          value="99.97%"
          delta="0.00%"
          hint="30 ngày"
          icon="chart"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card
          className="lg:col-span-2"
          title="Tình trạng đợt đăng ký"
          subtitle="Học kỳ 2 · Năm học 2025–2026"
          action={<Badge tone="success">Đang mở</Badge>}
        >
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[12.5px] text-ink-muted mb-1.5">
                <span>Tiến độ đăng ký</span>
                <span className="font-mono text-ink font-semibold">76%</span>
              </div>
              <div className="h-2 rounded-full bg-surface overflow-hidden">
                <div className="h-full bg-navy-600" style={{ width: "76%" }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="px-3 py-2.5 rounded-md bg-surface">
                <div className="text-[11.5px] text-ink-muted">Lớp đầy</div>
                <div className="text-xl font-semibold text-ink mt-0.5">128</div>
              </div>
              <div className="px-3 py-2.5 rounded-md bg-surface">
                <div className="text-[11.5px] text-ink-muted">Còn chỗ</div>
                <div className="text-xl font-semibold text-ink mt-0.5">312</div>
              </div>
              <div className="px-3 py-2.5 rounded-md bg-surface">
                <div className="text-[11.5px] text-ink-muted">Chưa mở</div>
                <div className="text-xl font-semibold text-ink mt-0.5">46</div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Cần xem xét" subtitle="Yêu cầu chờ duyệt">
          <ul className="space-y-3">
            {[
              { label: "Hủy đăng ký", count: 14, tone: "warn" as const },
              { label: "Đổi lớp", count: 7, tone: "accent" as const },
              { label: "Đăng ký muộn", count: 23, tone: "danger" as const },
              { label: "Mở lớp bổ sung", count: 3, tone: "neutral" as const },
            ].map((item) => (
              <li key={item.label} className="flex items-center justify-between">
                <span className="text-[13px] text-ink">{item.label}</span>
                <Badge tone={item.tone}>{item.count}</Badge>
              </li>
            ))}
          </ul>
          <Button variant="ghost" iconRight="arrowRight" className="mt-3 w-full justify-center">
            Xem danh sách phê duyệt
          </Button>
        </Card>
      </div>

      <Card title="Hoạt động gần đây">
        <ul className="divide-y divide-line">
          {[
            {
              icon: "users" as const,
              text: 'Tạo 42 tài khoản sinh viên khóa K21',
              time: "5 phút trước",
            },
            {
              icon: "clipboard" as const,
              text: "Mở thêm lớp CS101.04 — môn Nhập môn Lập trình",
              time: "1 giờ trước",
            },
            {
              icon: "megaphone" as const,
              text: "Gửi thông báo mở đợt đăng ký HK2 đến 12,840 SV",
              time: "Hôm qua",
            },
          ].map((a, i) => (
            <li key={i} className="flex items-center gap-3 py-2.5">
              <div className="w-8 h-8 rounded-md bg-surface text-ink-muted grid place-items-center">
                <Icon name={a.icon} size={16} />
              </div>
              <div className="flex-1 text-[13px] text-ink">{a.text}</div>
              <div className="text-[11.5px] text-ink-faint">{a.time}</div>
            </li>
          ))}
        </ul>
      </Card>

      <p className="text-[11.5px] text-ink-faint">
        Dữ liệu mẫu — sẽ thay bằng API sau khi backend implement module Báo cáo (FR-ADM-RPT).
      </p>
    </div>
  );
}
