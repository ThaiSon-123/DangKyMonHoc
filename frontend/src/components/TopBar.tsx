import { useLocation } from "react-router-dom";
import { useUIStore } from "@/stores/ui";
import AccountMenu from "./AccountMenu";
import NotificationBell from "./NotificationBell";
import Icon from "./ui/Icon";

const BREADCRUMB_MAP: Record<string, string[]> = {
  "/admin": ["Quản trị", "Tổng quan"],
  "/admin/accounts": ["Quản trị", "Đào tạo", "Tài khoản"],
  "/admin/majors": ["Quản trị", "Đào tạo", "Ngành đào tạo"],
  "/admin/curriculum": ["Quản trị", "Đào tạo", "Chương trình"],
  // Chi tiết CTĐT: /admin/curriculum/:id — fallback prefix match xử lý ở component
  "/admin/courses": ["Quản trị", "Đào tạo", "Môn học"],
  "/admin/semesters": ["Quản trị", "Đào tạo", "Học kỳ"],
  "/admin/classes": ["Quản trị", "Đào tạo", "Lớp học phần"],
  "/admin/registrations": ["Quản trị", "Vận hành", "Đăng ký"],
  "/admin/reports": ["Quản trị", "Vận hành", "Báo cáo"],
  "/admin/notifications": ["Quản trị", "Vận hành", "Thông báo"],
  "/admin/profile": ["Quản trị", "Hồ sơ"],
  "/student": ["Sinh viên", "Trang chủ"],
  "/student/register": ["Sinh viên", "Học tập", "Đăng ký môn"],
  "/student/auto": ["Sinh viên", "Học tập", "Tạo TKB tự động"],
  "/student/schedule": ["Sinh viên", "Học tập", "Thời khóa biểu"],
  "/student/curriculum": ["Sinh viên", "Học tập", "Chương trình đào tạo"],
  "/student/history": ["Sinh viên", "Học tập", "Lịch sử"],
  "/student/notifications": ["Sinh viên", "Thông báo"],
  "/student/profile": ["Sinh viên", "Hồ sơ"],
  "/teacher": ["Giáo viên", "Trang chủ"],
  "/teacher/schedule": ["Giáo viên", "Giảng dạy", "Lịch dạy"],
  "/teacher/classes": ["Giáo viên", "Giảng dạy", "Lớp phụ trách"],
  "/teacher/grades": ["Giáo viên", "Giảng dạy", "Nhập điểm"],
  "/teacher/notifications": ["Giáo viên", "Thông báo"],
  "/teacher/profile": ["Giáo viên", "Hồ sơ"],
};

export default function TopBar() {
  const location = useLocation();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  let breadcrumbs = BREADCRUMB_MAP[location.pathname] ?? ["Trang"];
  // Fallback prefix matching cho route con (vd. /admin/curriculum/123)
  if (breadcrumbs[0] === "Trang") {
    if (location.pathname.startsWith("/admin/curriculum/")) {
      breadcrumbs = ["Quản trị", "Đào tạo", "Chương trình", "Chi tiết"];
    } else if (location.pathname.startsWith("/admin/classes/")) {
      breadcrumbs = ["Quản trị", "Đào tạo", "Lớp học phần", "Chi tiết"];
    } else if (location.pathname.startsWith("/teacher/classes/")) {
      breadcrumbs = ["Giáo viên", "Giảng dạy", "Lớp phụ trách", "Chi tiết"];
    }
  }
  return (
    <header className="h-14 bg-card border-b border-line flex items-center pl-2 pr-2 md:pl-3 md:pr-5 gap-2 md:gap-4 flex-shrink-0">
      <button
        type="button"
        onClick={toggleSidebar}
        className="md:hidden w-9 h-9 rounded-md text-ink-muted hover:bg-surface grid place-items-center flex-shrink-0"
        aria-label="Mở menu"
      >
        <Icon name="menu" size={20} />
      </button>

      {/* Breadcrumb — chỉ hiện trang hiện tại trên mobile */}
      <div className="flex items-center gap-1.5 text-[13px] flex-1 min-w-0 overflow-hidden">
        {breadcrumbs.map((b, i) => {
          const isLast = i === breadcrumbs.length - 1;
          return (
            <div
              key={i}
              className={`items-center gap-1.5 ${isLast ? "flex min-w-0" : "hidden md:flex"}`}
            >
              {i > 0 && (
                <Icon
                  name="chevronRight"
                  size={14}
                  className="text-ink-faint flex-shrink-0 hidden md:inline-block"
                />
              )}
              <span
                className={
                  isLast
                    ? "text-ink font-semibold truncate"
                    : "text-ink-muted font-medium whitespace-nowrap"
                }
              >
                {b}
              </span>
            </div>
          );
        })}
      </div>

      <NotificationBell />
      <AccountMenu placement="topbar" />
    </header>
  );
}
