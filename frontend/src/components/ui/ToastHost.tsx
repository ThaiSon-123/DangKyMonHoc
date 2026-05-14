import { useEffect, useState } from "react";
import Icon from "./Icon";
import { TOAST_EVENT, type ToastPayload } from "@/lib/toast";

interface ToastItem extends ToastPayload {
  id: number;
  type: NonNullable<ToastPayload["type"]>;
}

const TONE_CLASS: Record<ToastItem["type"], string> = {
  error: "border-red-200 bg-red-50 text-red-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  info: "border-line bg-card text-ink",
};

export default function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function handleToast(event: Event) {
      const payload = (event as CustomEvent<ToastPayload>).detail;
      if (!payload?.message) return;
      const id = Date.now() + Math.random();
      setItems((current) => [
        ...current,
        {
          id,
          type: payload.type ?? "info",
          title: payload.title,
          message: payload.message,
        },
      ].slice(-4));
      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id));
      }, 4200);
    }

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed right-5 top-5 z-[80] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={`rounded-lg border px-3.5 py-3 shadow-lg ${TONE_CLASS[item.type]}`}
        >
          <div className="flex items-start gap-2.5">
            <Icon
              name={item.type === "error" ? "x" : item.type === "success" ? "check" : "bell"}
              size={16}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              {item.title && <div className="text-[13px] font-semibold">{item.title}</div>}
              <div className="mt-0.5 text-[12.5px] leading-relaxed">{item.message}</div>
            </div>
            <button
              type="button"
              className="rounded p-0.5 opacity-70 hover:bg-white/50 hover:opacity-100"
              onClick={() => setItems((current) => current.filter((next) => next.id !== item.id))}
              aria-label="Đóng thông báo"
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
