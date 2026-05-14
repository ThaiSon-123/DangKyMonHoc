import { AxiosError } from "axios";

const FIELD_LABELS: Record<string, string> = {
  username: "Tên đăng nhập",
  password: "Mật khẩu",
  email: "Email",
  full_name: "Họ và tên",
  role: "Vai trò",
  phone: "Số điện thoại",
  student_major: "Ngành học",
  teacher_department: "Khoa",
  code: "Mã",
  name: "Tên",
  department: "Khoa",
  duration_years: "Số năm đào tạo",
  start_date: "Ngày bắt đầu",
  end_date: "Ngày kết thúc",
  registration_start: "Thời gian bắt đầu đăng ký",
  registration_end: "Thời gian kết thúc đăng ký",
  class_section: "Lớp học phần",
  course: "Môn học",
  semester: "Học kỳ",
  teacher: "Giáo viên",
  room: "Phòng học",
  weekday: "Thứ học",
  session: "Buổi học",
  start_period: "Tiết bắt đầu",
  periods_per_session: "Số tiết mỗi buổi",
  max_students: "Sĩ số tối đa",
  prerequisite_ids: "Môn tiên quyết",
  recipients: "Người nhận",
  title: "Tiêu đề",
  body: "Nội dung",
};

function normalizeMessage(message: unknown): string {
  const text = String(message);
  const lower = text.toLowerCase();
  if (lower === "this field is required.") return "Vui lòng nhập thông tin này.";
  if (lower === "this field may not be blank.") return "Thông tin này không được để trống.";
  if (lower === "this field may not be null.") return "Vui lòng chọn thông tin này.";
  if (lower === "a valid integer is required.") return "Giá trị phải là số hợp lệ.";
  if (lower === "a valid number is required.") return "Giá trị phải là số hợp lệ.";
  if (lower.includes("object does not exist")) return "Dữ liệu được chọn không còn tồn tại.";
  if (lower.includes("incorrect type")) return "Dữ liệu được chọn không hợp lệ.";
  return text;
}

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replaceAll("_", " ");
}

function formatFieldMessage(key: string, rawMessages: unknown[]): string[] {
  if (key === "non_field_errors") return rawMessages.map(normalizeMessage);

  const label = fieldLabel(key);
  return rawMessages.map((raw) => {
    const message = normalizeMessage(raw);
    const lower = message.toLowerCase();

    if (lower === "vui lòng nhập thông tin này.") {
      return `Vui lòng nhập ${label.toLowerCase()}.`;
    }
    if (lower === "thông tin này không được để trống.") {
      return `${label} không được để trống.`;
    }
    if (lower === "vui lòng chọn thông tin này.") {
      return `Vui lòng chọn ${label.toLowerCase()}.`;
    }
    if (key === "end_date" && lower.startsWith("phải sau")) {
      return `${label} phải sau ngày bắt đầu.`;
    }
    if (key === "registration_end" && lower.startsWith("phải sau")) {
      return `${label} phải sau thời gian bắt đầu đăng ký.`;
    }
    if (key === "code" && (message === "Mã môn học đã tồn tại" || message === "Mã học kỳ đã tồn tại.")) {
      return message;
    }
    if (
      lower.includes(label.toLowerCase())
      || lower.includes("giáo viên")
      || lower.includes("phòng")
      || lower.includes("học kỳ")
      || lower.includes("lớp")
    ) {
      return message;
    }
    return `${label}: ${message}`;
  });
}

/**
 * Trích lỗi từ DRF response. Field key kỹ thuật sẽ được đổi sang nhãn người dùng.
 */
export function extractApiError(err: unknown, fallback = "Có lỗi xảy ra."): string {
  if (err instanceof AxiosError && err.response) {
    const data = err.response.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      if ("detail" in data && typeof data.detail === "string") return data.detail;
      const parts: string[] = [];
      for (const [key, value] of Object.entries(data)) {
        const messages = Array.isArray(value) ? value : [value];
        parts.push(...formatFieldMessage(key, messages));
      }
      if (parts.length) return parts.join(" · ");
    }
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
