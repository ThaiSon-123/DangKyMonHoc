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
