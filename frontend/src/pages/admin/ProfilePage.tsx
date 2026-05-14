import { Badge, Card } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import { getInitials } from "@/lib/names";
import { useAuthStore } from "@/stores/auth";

export default function AdminProfilePage() {
  const me = useAuthStore((s) => s.user);

  if (!me) {
    return <div className="text-ink-muted">Đang tải hồ sơ...</div>;
  }

  const initials = getInitials(me.full_name || me.username);

  return (
    <div className="space-y-5">
      <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
        Hồ sơ quản trị viên
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center py-3">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-500 to-slate-900 text-white grid place-items-center text-3xl font-semibold mb-3">
              {initials}
            </div>
            <div className="text-[18px] font-semibold text-ink">
              {me.full_name || me.username}
            </div>
            <div className="text-[13px] text-ink-muted font-mono mt-0.5">
              {me.username}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge tone="accent">Quản trị viên</Badge>
              {me.is_locked ? (
                <Badge tone="danger">Đã khoá</Badge>
              ) : (
                <Badge tone="success">Đang hoạt động</Badge>
              )}
            </div>
          </div>
        </Card>

        <Card title="Thông tin tài khoản" className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <InfoRow icon="user" label="Họ tên">
              <div className="text-[13.5px] text-ink font-semibold">
                {me.full_name || <span className="text-ink-faint">Chưa cập nhật</span>}
              </div>
            </InfoRow>
            <InfoRow icon="doc" label="Tài khoản">
              <div className="text-[13.5px] text-ink font-mono font-semibold">
                {me.username}
              </div>
            </InfoRow>
            <InfoRow icon="doc" label="Email">
              <div className="text-[13.5px] text-ink">
                {me.email || <span className="text-ink-faint">Chưa cập nhật</span>}
              </div>
            </InfoRow>
            <InfoRow icon="megaphone" label="Số điện thoại">
              <div className="text-[13.5px] text-ink font-mono">
                {me.phone || <span className="text-ink-faint">Chưa cập nhật</span>}
              </div>
            </InfoRow>
          </div>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: "user" | "doc" | "megaphone";
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-md bg-surface text-ink-muted grid place-items-center flex-shrink-0 mt-0.5">
        <Icon name={icon} size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11.5px] text-ink-muted uppercase tracking-wider font-semibold mb-0.5">
          {label}
        </div>
        {children}
      </div>
    </div>
  );
}
