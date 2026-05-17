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
  course_ids: "Danh sách môn",
  avoid_weekdays: "Ngày tránh",
  preferred_sessions: "Ca học",
  preferred_teacher_ids: "Giáo viên ưu tiên",
  preset: "Chế độ ưu tiên",
  max_results: "Số phương án tối đa",
  course_teacher_constraints: "Giáo viên theo môn",
  process_score: "Điểm quá trình",
  midterm_score: "Điểm giữa kỳ",
  final_score: "Điểm cuối kỳ",
  total_score: "Điểm tổng kết",
  gpa_4: "GPA thang 4",
  note: "Ghi chú",
  cancel_reason: "Lý do hủy",
};

function isVietnamese(text: string): boolean {
  // Heuristic: chứa ký tự tiếng Việt có dấu, hoặc đã có cụm từ tiếng Việt phổ biến
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/.test(text)) {
    return true;
  }
  const lower = text.toLowerCase();
  return /\b(vui lòng|không|đã|phải|hợp lệ|đăng ký|học kỳ|tài khoản)\b/.test(lower);
}

function normalizeMessage(message: unknown): string {
  const text = String(message).trim();
  const lower = text.toLowerCase();

  // Common DRF English messages → tiếng Việt
  if (lower === "this field is required.") return "Vui lòng nhập thông tin này.";
  if (lower === "this field may not be blank.") return "Thông tin này không được để trống.";
  if (lower === "this field may not be null.") return "Vui lòng chọn thông tin này.";
  if (lower === "a valid integer is required.") return "Giá trị phải là số nguyên hợp lệ.";
  if (lower === "a valid number is required.") return "Giá trị phải là số hợp lệ.";
  if (lower === "enter a valid email address.") return "Email không hợp lệ.";
  if (lower === "enter a valid url.") return "Đường dẫn không hợp lệ.";
  if (lower === "enter a valid date.") return "Ngày không hợp lệ.";
  if (lower === "enter a valid date/time.") return "Thời gian không hợp lệ.";
  if (lower === "enter a valid boolean.") return "Giá trị phải là đúng/sai.";
  if (lower.includes("object does not exist")) return "Dữ liệu được chọn không còn tồn tại.";
  if (lower.includes("incorrect type")) return "Dữ liệu được chọn không hợp lệ.";
  if (lower.includes("invalid pk")) return "Dữ liệu được chọn không tồn tại.";
  if (lower.includes("not a valid choice")) return "Lựa chọn không hợp lệ.";
  if (lower.includes("ensure this value is greater than")) return "Giá trị phải lớn hơn mức tối thiểu.";
  if (lower.includes("ensure this value is less than")) return "Giá trị phải nhỏ hơn mức tối đa.";
  if (lower.includes("ensure that there are no more than")) return "Vượt quá số lượng cho phép.";
  if (lower.includes("ensure this filename has at most")) return "Tên tệp quá dài.";
  if (lower.includes("authentication credentials were not provided")) return "Vui lòng đăng nhập để tiếp tục.";
  if (lower === "incorrect authentication credentials.") return "Tên đăng nhập hoặc mật khẩu không đúng.";
  if (lower === "no active account found with the given credentials") return "Tên đăng nhập hoặc mật khẩu không đúng.";
  if (lower.includes("token is invalid")) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (lower.includes("token is blacklisted")) return "Phiên đăng nhập không còn hợp lệ.";
  if (lower.includes("you do not have permission")) return "Bạn không có quyền thực hiện thao tác này.";
  if (lower === "not found.") return "Không tìm thấy dữ liệu.";
  if (lower.includes("must make a unique set")) return "Dữ liệu này đã tồn tại.";
  if (lower.includes("with this") && lower.includes("already exists")) return "Giá trị này đã tồn tại.";
  if (lower.includes("must be a list")) return "Định dạng dữ liệu không hợp lệ.";

  return text;
}

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replaceAll("_", " ");
}

function formatFieldMessage(key: string, rawMessages: unknown[]): string[] {
  if (key === "non_field_errors" || key === "detail") {
    return rawMessages.map((m) => normalizeMessage(m));
  }

  const label = fieldLabel(key);
  return rawMessages.map((raw) => {
    const message = normalizeMessage(raw);
    const lower = message.toLowerCase();

    if (lower === "vui lòng nhập thông tin này.") return `Vui lòng nhập ${label.toLowerCase()}.`;
    if (lower === "thông tin này không được để trống.") return `${label} không được để trống.`;
    if (lower === "vui lòng chọn thông tin này.") return `Vui lòng chọn ${label.toLowerCase()}.`;

    if (key === "end_date" && lower.startsWith("phải sau")) return `${label} phải sau ngày bắt đầu.`;
    if (key === "registration_end" && lower.startsWith("phải sau")) {
      return `${label} phải sau thời gian bắt đầu đăng ký.`;
    }

    // Nếu message đã tự sự rõ ràng tiếng Việt → trả nguyên (tránh prefix "Label: ...")
    if (isVietnamese(message) && message.length > 8) {
      return message;
    }

    // Fallback: ghép label + message nhưng đảm bảo tiếng Việt
    return `${label}: ${message}`;
  });
}

/**
 * Trích lỗi từ DRF response → message tiếng Việt thân thiện.
 *
 * - Không bao giờ leak field key kỹ thuật (vd "course_ids", "non_field_errors")
 * - Convert mọi message DRF tiếng Anh phổ biến → tiếng Việt
 * - Nếu lỗi mạng (no response) → "Không kết nối được máy chủ..."
 */
export function extractApiError(err: unknown, fallback = "Có lỗi xảy ra. Vui lòng thử lại."): string {
  if (err instanceof AxiosError) {
    if (!err.response) {
      return "Không kết nối được máy chủ. Vui lòng kiểm tra mạng rồi thử lại.";
    }
    const status = err.response.status;
    const data = err.response.data;

    if (typeof data === "string" && data) {
      return normalizeMessage(data);
    }
    if (data && typeof data === "object") {
      // Ưu tiên detail (DRF chuẩn)
      if ("detail" in data && typeof data.detail === "string") {
        return normalizeMessage(data.detail);
      }
      const parts: string[] = [];
      for (const [key, value] of Object.entries(data)) {
        const messages = Array.isArray(value) ? value : [value];
        parts.push(...formatFieldMessage(key, messages));
      }
      if (parts.length) return parts.join(" · ");
    }

    // Fallback theo status code
    if (status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (status === 403) return "Bạn không có quyền thực hiện thao tác này.";
    if (status === 404) return "Không tìm thấy dữ liệu yêu cầu.";
    if (status === 409) return "Dữ liệu xung đột với bản ghi hiện có.";
    if (status === 429) return "Bạn thao tác quá nhanh. Vui lòng thử lại sau.";
    if (status >= 500) return "Máy chủ đang gặp sự cố. Vui lòng thử lại sau ít phút.";
  }
  if (err instanceof Error && err.message) {
    return normalizeMessage(err.message);
  }
  return fallback;
}
