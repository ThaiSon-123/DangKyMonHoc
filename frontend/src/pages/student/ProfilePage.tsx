import { useEffect, useState } from "react";
import { Badge, Card, Stat } from "@/components/ui";
import Icon from "@/components/ui/Icon";
import { getMyStudentProfile, type StudentProfile } from "@/api/students";
import { extractApiError } from "@/lib/errors";
import { getInitials } from "@/lib/names";
import { useAuthStore } from "@/stores/auth";

export default function StudentProfilePage() {
  const me = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMyStudentProfile()
      .then((d) => {
        if (active) setProfile(d);
      })
      .catch((err) => {
        if (active) setError(extractApiError(err, "Không tải được hồ sơ."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="text-ink-muted">Đang tải hồ sơ...</div>;
  }

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

  // Tính số năm đào tạo còn lại / đã học (giả sử 4 năm)
  const currentYear = new Date().getFullYear();
  const yearsAtSchool = currentYear - profile.enrollment_year;

  return (
    <div className="space-y-5">
      <h1 className="m-0 text-[22px] font-semibold tracking-tight text-ink">
        Hồ sơ cá nhân
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Avatar + tên */}
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center py-3">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-navy-500 to-navy-900 text-white grid place-items-center text-3xl font-semibold mb-3">
              {initials}
            </div>
            <div className="text-[18px] font-semibold text-ink">
              {profile.full_name || profile.username}
            </div>
            <div className="text-[13px] text-ink-muted font-mono mt-0.5">
              MSSV: {profile.student_code}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge tone="accent">Sinh viên</Badge>
              {profile.is_active ? (
                <Badge tone="success">Đang học</Badge>
              ) : (
                <Badge tone="neutral">Đã nghỉ</Badge>
              )}
            </div>
          </div>
        </Card>

        {/* Thông tin học vụ */}
        <Card title="Thông tin học vụ" className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <InfoRow icon="graduation" label="Ngành học">
              <div className="text-[13.5px] text-ink font-semibold">{profile.major_name}</div>
              <div className="text-[12px] text-ink-muted font-mono">{profile.major_code}</div>
            </InfoRow>
            <InfoRow icon="calendar" label="Khóa">
              <div className="text-[13.5px] text-ink font-semibold font-mono">
                K{profile.enrollment_year}
              </div>
              <div className="text-[12px] text-ink-muted">
                Đã học {yearsAtSchool} năm
              </div>
            </InfoRow>
            <InfoRow icon="chart" label="GPA tích luỹ">
              <div className="text-[13.5px] text-ink font-semibold font-mono">
                {profile.gpa || "—"} / 10
              </div>
            </InfoRow>
            <InfoRow icon="book" label="Số tín chỉ đã hoàn thành">
              <div className="text-[13.5px] text-ink font-semibold font-mono">
                {profile.completed_credits} TC
              </div>
            </InfoRow>
          </div>
        </Card>
      </div>

      {/* Thông tin liên hệ */}
      <Card title="Thông tin liên hệ">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <InfoRow icon="user" label="Tên đăng nhập">
            <div className="text-[13.5px] text-ink font-mono">{profile.username}</div>
          </InfoRow>
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

      {/* Tóm tắt KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="GPA tích luỹ"
          value={profile.gpa || "—"}
          hint="thang điểm 10"
          icon="chart"
          tone="accent"
        />
        <Stat
          label="Tín chỉ tích luỹ"
          value={profile.completed_credits}
          hint="đã hoàn thành"
          icon="book"
        />
        <Stat
          label="Số năm đào tạo"
          value={yearsAtSchool}
          hint={`khoá ${profile.enrollment_year}`}
          icon="calendar"
        />
        <Stat
          label="Trạng thái"
          value={profile.is_active ? "Đang học" : "Đã nghỉ"}
          icon="user"
        />
      </div>

      <p className="text-[11.5px] text-ink-faint">
        Để cập nhật thông tin (email, số điện thoại, mật khẩu...), liên hệ phòng đào tạo. Một số
        trường (ngành, khóa, MSSV) chỉ Admin có thể sửa để đảm bảo tính nhất quán dữ liệu.
      </p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: "graduation" | "calendar" | "chart" | "book" | "user" | "doc" | "megaphone" | "lock";
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
