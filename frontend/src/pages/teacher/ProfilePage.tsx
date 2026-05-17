import { useEffect, useState } from "react";
import { Badge, Card } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import { getMyTeacherProfile } from "@/api/teachers";
import { extractApiError } from "@/lib/errors";
import { getInitials } from "@/lib/names";
import { useAuthStore } from "@/stores/auth";
import type { TeacherProfile } from "@/types/domain";

export default function TeacherProfilePage() {
  const me = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMyTeacherProfile()
      .then((d) => active && setProfile(d))
      .catch((err) => active && setError(extractApiError(err, "Không tải được hồ sơ.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <div className="text-ink-muted">Đang tải hồ sơ...</div>;

  if (error || !profile) {
    return (
      <Card>
        <div className="py-10 text-center">
          <div className="w-14 h-14 rounded-xl bg-red-50 text-danger grid place-items-center mx-auto mb-3">
            <Icon name="x" size={28} />
          </div>
          <div className="text-[15px] font-semibold text-ink mb-1">Không tải được hồ sơ</div>
          <p className="text-[13px] text-ink-muted">{error}</p>
        </div>
      </Card>
    );
  }

  const initials = getInitials(profile.full_name || profile.username);

  return (
    <div className="space-y-5">
      <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
        Hồ sơ giảng viên
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center py-3">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-900 text-white grid place-items-center text-3xl font-semibold mb-3">
              {initials}
            </div>
            <div className="text-[12px] text-ink-muted font-mono uppercase">
              {profile.title || "Giảng viên"}
            </div>
            <div className="text-[18px] font-semibold text-ink mt-0.5">
              {profile.full_name || profile.username}
            </div>
            <div className="text-[13px] text-ink-muted font-mono mt-0.5">
              {profile.teacher_code}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge tone="success">Giáo viên</Badge>
              {profile.is_active ? (
                <Badge tone="accent">Đang giảng dạy</Badge>
              ) : (
                <Badge tone="neutral">Đã nghỉ</Badge>
              )}
            </div>
          </div>
        </Card>

        <Card title="Thông tin công tác" className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <InfoRow icon="building" label="Khoa">
              <div className="text-[13.5px] text-ink font-semibold">
                {profile.department || <span className="text-ink-faint">—</span>}
              </div>
            </InfoRow>
            <InfoRow icon="graduation" label="Học vị / chức danh">
              <div className="text-[13.5px] text-ink">
                {profile.title || <span className="text-ink-faint">Chưa cập nhật</span>}
              </div>
            </InfoRow>
            <InfoRow icon="user" label="Tên đăng nhập">
              <div className="text-[13.5px] text-ink font-mono">{profile.username}</div>
            </InfoRow>
            <InfoRow icon="doc" label="Mã giáo viên">
              <div className="text-[13.5px] text-ink font-mono font-semibold">
                {profile.teacher_code}
              </div>
            </InfoRow>
          </div>
        </Card>
      </div>

      <Card title="Thông tin liên hệ">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <InfoRow icon="doc" label="Email">
            <div className="text-[13.5px] text-ink">
              {me?.email || <span className="text-ink-faint">Chưa cập nhật</span>}
            </div>
          </InfoRow>
          <InfoRow icon="megaphone" label="Số điện thoại">
            <div className="text-[13.5px] text-ink font-mono">
              {me?.phone || <span className="text-ink-faint">Chưa cập nhật</span>}
            </div>
          </InfoRow>
          <InfoRow icon="lock" label="Bảo mật">
            <div className="text-[13.5px] text-ink">
              {me?.is_locked ? (
                <Badge tone="danger">Đã khoá</Badge>
              ) : (
                <Badge tone="success">Tài khoản hoạt động</Badge>
              )}
            </div>
          </InfoRow>
        </div>
      </Card>

      <p className="text-[11.5px] text-ink-faint">
        Để cập nhật thông tin (email, số điện thoại, mật khẩu...), liên hệ phòng tổ chức cán bộ.
      </p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: "building" | "graduation" | "user" | "doc" | "megaphone" | "lock";
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
