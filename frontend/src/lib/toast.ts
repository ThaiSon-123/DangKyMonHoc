export type ToastType = "success" | "error" | "info";

export interface ToastPayload {
  type?: ToastType;
  title?: string;
  message: string;
}

export const TOAST_EVENT = "dkmh:toast";

export function showToast(payload: ToastPayload) {
  window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT, { detail: payload }));
}

export function showErrorToast(message: string, title = "Không thực hiện được") {
  showToast({ type: "error", title, message });
}

export function showSuccessToast(message: string, title = "Thành công") {
  showToast({ type: "success", title, message });
}

export function showInfoToast(message: string, title?: string) {
  showToast({ type: "info", title, message });
}
