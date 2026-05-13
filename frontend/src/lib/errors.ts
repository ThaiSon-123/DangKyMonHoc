import { AxiosError } from "axios";

/**
 * Trích lỗi từ DRF response. DRF có thể trả:
 *  - { "field_x": ["msg1", "msg2"] }
 *  - { "detail": "msg" }
 *  - { "non_field_errors": ["msg"] }
 */
export function extractApiError(err: unknown, fallback = "Có lỗi xảy ra."): string {
  if (err instanceof AxiosError && err.response) {
    const data = err.response.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      if ("detail" in data && typeof data.detail === "string") return data.detail;
      const parts: string[] = [];
      for (const [key, value] of Object.entries(data)) {
        const messages = Array.isArray(value) ? value : [String(value)];
        if (key === "non_field_errors") {
          parts.push(...messages);
        } else {
          parts.push(`${key}: ${messages.join(", ")}`);
        }
      }
      if (parts.length) return parts.join(" · ");
    }
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
