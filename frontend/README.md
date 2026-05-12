# Frontend - Hệ Thống Đăng Ký Môn Học

Frontend ReactJS + Vite + Tailwind CSS + Zustand. Tham chiếu [`doc/plan.md`](../doc/plan.md).

## Tech stack

- ReactJS 18 + TypeScript
- Vite 6
- Tailwind CSS 3
- Zustand (state management)
- React Router 6
- Axios (HTTP client + JWT interceptor)

## Cấu trúc

```
frontend/
├── src/
│   ├── api/             # axios client + endpoint wrappers
│   │   ├── client.ts    # interceptor JWT + auto refresh
│   │   └── auth.ts
│   ├── stores/
│   │   └── auth.ts      # Zustand auth store (persist localStorage)
│   ├── components/
│   │   └── Layout.tsx   # Sidebar + nav theo role
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── StudentDashboard.tsx
│   │   └── TeacherDashboard.tsx
│   ├── routes/
│   │   └── ProtectedRoute.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── .env.example
```

## Setup

Yêu cầu: Node.js 20+ và npm (hoặc pnpm/yarn).

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

Mở http://localhost:5173.

## Auth flow

1. User nhập username/password trên `/login`
2. Gọi `POST /api/auth/login/` → nhận `access` + `refresh`
3. Token lưu trong Zustand (persist localStorage)
4. Mọi request gắn `Authorization: Bearer <access>` qua axios interceptor
5. Nếu 401 → interceptor tự gọi `/api/auth/refresh/` rồi retry request
6. Refresh fail → logout, redirect `/login`

## Route theo role

| Path | Role yêu cầu |
|------|--------------|
| `/login` | public |
| `/` | redirect theo role |
| `/admin` | ADMIN |
| `/student` | STUDENT |
| `/teacher` | TEACHER |

`ProtectedRoute` chặn user chưa login (redirect `/login`) và user sai role (redirect `/`).

## Cấu hình backend URL

Sửa `.env`:

```
VITE_API_BASE_URL=http://localhost:8000/api
```

## Lưu ý

- Backend phải chạy ở port 8000 (`docker compose up` trong `backend/`).
- CORS đã cho phép `http://localhost:5173` từ phía backend.
- Path alias `@/*` trỏ về `src/*`.
