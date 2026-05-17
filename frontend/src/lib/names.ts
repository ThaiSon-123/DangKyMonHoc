/**
 * Lấy chữ cái đầu của tên cho avatar.
 * "Nguyễn Văn An" → "NA"
 * "An" → "A"
 * "" → "?"
 */
export function getInitials(fullName: string): string {
  const cleaned = fullName.trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
