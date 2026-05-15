import type { Semester } from "@/types/domain";

// ──────────────────────────── Active semester picker ────────────────────────────

export type SemesterStatus = "active" | "upcoming" | "none";

export interface ActiveSemesterResult {
  semester: Semester | null;
  status: SemesterStatus;
}

/**
 * Chọn học kỳ phù hợp cho UI đăng ký môn / TKB tự động.
 *
 * - "active": is_open=true + đang trong cửa sổ đăng ký (registration_start ≤ now ≤ registration_end).
 *   Ưu tiên trả về — SV có thể đăng ký ngay.
 * - "upcoming": is_open=true + chưa tới cửa sổ đăng ký. Hiện thông tin nhưng KHÔNG cho đăng ký.
 *   Khi đã có "active", upcoming bị ẨN.
 * - "none": cả hai đều không có → empty state.
 */
export function pickActiveSemester(semesters: Semester[]): ActiveSemesterResult {
  const now = Date.now();

  function inActiveWindow(s: Semester): boolean {
    if (!s.is_open) return false;
    if (!s.registration_start || !s.registration_end) return false;
    const start = new Date(s.registration_start).getTime();
    const end = new Date(s.registration_end).getTime();
    return start <= now && now <= end;
  }

  function isUpcoming(s: Semester): boolean {
    if (!s.is_open) return false;
    if (!s.registration_start) return false;
    return new Date(s.registration_start).getTime() > now;
  }

  // 1. Active (đang trong cửa sổ đăng ký)
  const active = semesters.find(inActiveWindow);
  if (active) return { semester: active, status: "active" };

  // 2. Upcoming (sắp mở) — chọn gần nhất
  const upcoming = semesters
    .filter(isUpcoming)
    .sort((a, b) => {
      const ta = new Date(a.registration_start!).getTime();
      const tb = new Date(b.registration_start!).getTime();
      return ta - tb;
    })[0];
  if (upcoming) return { semester: upcoming, status: "upcoming" };

  return { semester: null, status: "none" };
}

export function formatRegistrationWindow(s: Semester): string {
  if (!s.registration_start || !s.registration_end) return "—";
  const start = new Date(s.registration_start);
  const end = new Date(s.registration_end);
  const fmt = (d: Date) =>
    d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${fmt(start)} → ${fmt(end)}`;
}

// ──────────────────────────── Suggested-semester label ────────────────────────────

/**
 * Tính nhãn hiển thị cho 1 ô "học kỳ gợi ý" trong CTĐT.
 *
 * Quy ước: 2 học kỳ chính (HK1 + HK2) mỗi năm học, không tính HK3.
 * (HK3 không xếp trong dòng chảy CTĐT chính).
 *
 * Ví dụ với cohort_year = 2023:
 *   - suggested=1 → "Học kỳ 1 - Năm học 2023 - 2024"
 *   - suggested=2 → "Học kỳ 2 - Năm học 2023 - 2024"
 *   - suggested=3 → "Học kỳ 1 - Năm học 2024 - 2025"
 *   - suggested=4 → "Học kỳ 2 - Năm học 2024 - 2025"
 */
export function semesterLabel(suggested: number, cohortYear: number): string {
  const yearOffset = Math.floor((suggested - 1) / 2);
  const termInYear = ((suggested - 1) % 2) + 1;
  const startYear = cohortYear + yearOffset;
  return `Học kỳ ${termInYear} - Năm học ${startYear} - ${startYear + 1}`;
}

/** Nhãn ngắn cho tooltip / cell hẹp. */
export function semesterLabelShort(suggested: number, cohortYear: number): string {
  const yearOffset = Math.floor((suggested - 1) / 2);
  const termInYear = ((suggested - 1) % 2) + 1;
  const startYear = cohortYear + yearOffset;
  return `HK${termInYear} ${startYear}-${startYear + 1}`;
}
