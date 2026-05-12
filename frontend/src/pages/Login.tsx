import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUser, login } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";

export default function Login() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { access, refresh } = await login(username, password);
      setTokens(access, refresh);
      const me = await fetchCurrentUser();
      setUser(me);
      const dest =
        me.role === "ADMIN" ? "/admin" : me.role === "TEACHER" ? "/teacher" : "/student";
      navigate(dest, { replace: true });
    } catch {
      setError("Tên đăng nhập hoặc mật khẩu không đúng.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-slate-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white shadow rounded-lg p-6 space-y-4"
      >
        <h1 className="text-xl font-semibold text-center">Đăng Nhập</h1>

        <div>
          <label className="block text-sm font-medium mb-1">Tên đăng nhập</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            required
          />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white py-2 rounded text-sm font-medium"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
