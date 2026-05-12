/* eslint-disable react/prop-types */
/* Shared UI primitives for the Đăng ký Môn học design canvas.
   Navy formal corporate aesthetic. All theming via CSS custom properties
   on an AppShell root so each artboard can be themed independently. */

// ─── ICONS ──────────────────────────────────────────────────────────────────
// Hand-rolled minimal line icons (currentColor, 1.6 stroke, 20×20 viewbox).
const ICONS = {
  home: 'M3 10.5L10 4l7 6.5V17a1 1 0 01-1 1h-3v-5H7v5H4a1 1 0 01-1-1v-6.5z',
  book: 'M4 4.5A1.5 1.5 0 015.5 3H16v13H5.5a1.5 1.5 0 00-1.5 1.5V4.5zM16 16v2H5.5',
  users: 'M14 13.5A4.5 4.5 0 109.5 9 4.5 4.5 0 0014 13.5zM2 18a6 6 0 0112 0M14 11a4 4 0 014 4',
  calendar: 'M4 5.5h12a1 1 0 011 1V16a1 1 0 01-1 1H4a1 1 0 01-1-1V6.5a1 1 0 011-1zM3 9h14M7 3v4M13 3v4',
  clipboard: 'M7 4.5h6m-7 1.5h8a1 1 0 011 1V17a1 1 0 01-1 1H6a1 1 0 01-1-1V7a1 1 0 011-1z M8 3.5h4v2H8z',
  layers: 'M10 3l7 4-7 4-7-4 7-4zM3 11l7 4 7-4M3 14.5l7 4 7-4',
  bell: 'M5 14V9a5 5 0 0110 0v5l1.5 1.5H3.5L5 14zM8 17.5a2 2 0 004 0',
  search: 'M9 3a6 6 0 014.5 10l3.5 3.5M9 15A6 6 0 119 3',
  settings: 'M10 2v2M10 16v2M3.5 6L5 7M15 13l1.5 1M2 10h2M16 10h2M3.5 14L5 13M15 7l1.5-1M13 10a3 3 0 11-6 0 3 3 0 016 0z',
  chevronRight: 'M8 5l5 5-5 5',
  chevronDown: 'M5 8l5 5 5-5',
  chevronLeft: 'M12 5l-5 5 5 5',
  plus: 'M10 4v12M4 10h12',
  filter: 'M3 5h14M6 10h8M8 15h4',
  download: 'M10 3v10M5 9l5 5 5-5M3 17h14',
  upload: 'M10 17V7M5 11l5-5 5 5M3 3h14',
  edit: 'M14 3l3 3-9 9H5v-3l9-9z',
  trash: 'M4 6h12M8 6V4h4v2M5 6l1 11h8l1-11',
  check: 'M4 10l4 4 8-9',
  x: 'M5 5l10 10M15 5L5 15',
  graduation: 'M2 8l8-4 8 4-8 4-8-4zM5 10v4a5 5 0 0010 0v-4',
  chart: 'M3 17V3M3 17h14M7 13V9M11 13V6M15 13v-3',
  megaphone: 'M3 8v4l11 5V3L3 8zM3 8h2v4H3z',
  user: 'M10 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM3 18a7 7 0 0114 0',
  lock: 'M5 9h10v8H5V9zM7 9V6a3 3 0 016 0v3',
  sun: 'M10 4V2M10 18v-2M4 10H2M18 10h-2M5 5L3.5 3.5M16.5 16.5L15 15M5 15l-1.5 1.5M16.5 3.5L15 5M10 14a4 4 0 100-8 4 4 0 000 8z',
  moon: 'M16 11A6 6 0 019 4a6 6 0 1010 7z',
  sparkle: 'M10 3v4M10 13v4M3 10h4M13 10h4M5 5l3 3M15 15l-3-3M5 15l3-3M15 5l-3 3',
  building: 'M3 17h14M5 17V5h10v12M8 8h1M11 8h1M8 11h1M11 11h1M8 14h4',
  clock: 'M10 5v5l3 2M10 17a7 7 0 100-14 7 7 0 000 14z',
  pin: 'M10 11v6M5 8a5 5 0 1110 0c0 3-5 6-5 6S5 11 5 8z',
  arrowRight: 'M4 10h12M11 5l5 5-5 5',
  menu: 'M3 6h14M3 10h14M3 14h14',
  close: 'M4 4l12 12M16 4L4 16',
  doc: 'M5 3h7l4 4v10H5V3zM12 3v4h4',
  more: 'M5 10a1 1 0 102 0 1 1 0 00-2 0zM9 10a1 1 0 102 0 1 1 0 00-2 0zM13 10a1 1 0 102 0 1 1 0 00-2 0z',
};

const Icon = ({ name, size = 18, stroke = 1.7, style = {}, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    style={{ flex: '0 0 auto', ...style }} {...rest}>
    <path d={ICONS[name] || ICONS.doc} />
  </svg>
);

// ─── APP SHELL ─────────────────────────────────────────────────────────────
const AppShell = ({ dark, accent, role, sidebarCollapsed, sidebar, topbar, children, density = 'regular' }) => {
  const themeVars = dark ? {
    '--bg': '#0b1220',
    '--surface': '#0f1a2e',
    '--card': '#13213a',
    '--cardAlt': '#172945',
    '--text': '#e8eef7',
    '--textMuted': '#94a3b8',
    '--textFaint': '#64748b',
    '--border': '#1f3050',
    '--borderStrong': '#2a3f64',
    '--hover': 'rgba(255,255,255,0.04)',
    '--shadow': '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.35)',
    '--ringFocus': 'rgba(255,255,255,0.08)',
    '--success': '#22c55e',
    '--warn': '#f59e0b',
    '--danger': '#ef4444',
    '--accent': accent,
    '--accentSoft': accent + '22',
    '--accentText': '#ffffff',
    '--sidebarBg': '#0a1426',
    '--sidebarText': '#cbd5e1',
    '--sidebarActive': accent,
  } : {
    '--bg': '#f6f8fb',
    '--surface': '#eef2f7',
    '--card': '#ffffff',
    '--cardAlt': '#f8fafc',
    '--text': '#0f172a',
    '--textMuted': '#475569',
    '--textFaint': '#94a3b8',
    '--border': '#e4e9f1',
    '--borderStrong': '#cbd5e1',
    '--hover': 'rgba(15,23,42,0.04)',
    '--shadow': '0 1px 0 rgba(255,255,255,0.6) inset, 0 4px 16px rgba(15,23,42,0.06)',
    '--ringFocus': 'rgba(15,23,42,0.06)',
    '--success': '#16a34a',
    '--warn': '#d97706',
    '--danger': '#dc2626',
    '--accent': accent,
    '--accentSoft': accent + '14',
    '--accentText': '#ffffff',
    '--sidebarBg': '#0e1c33',
    '--sidebarText': '#cbd5e1',
    '--sidebarActive': accent,
  };

  return (
    <div className="appshell" style={{
      ...themeVars,
      width: '100%', height: '100%',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: '"IBM Plex Sans","Plus Jakarta Sans",system-ui,sans-serif',
      fontSize: 14,
      letterSpacing: '-0.005em',
      display: 'grid',
      gridTemplateColumns: sidebarCollapsed ? '64px 1fr' : '240px 1fr',
      gridTemplateRows: '56px 1fr',
      overflow: 'hidden',
    }}>
      {sidebar}
      {topbar}
      <main style={{ overflow: 'auto', padding: 24, gridColumn: '2 / 3', gridRow: '2 / 3' }}>
        {children}
      </main>
    </div>
  );
};

// ─── SIDEBAR ───────────────────────────────────────────────────────────────
const Sidebar = ({ role, active, collapsed, dark }) => {
  const NAV = {
    admin: [
      { id: 'dashboard', icon: 'home', label: 'Tổng quan', section: '' },
      { id: 'accounts', icon: 'users', label: 'Tài khoản', section: 'Đào tạo' },
      { id: 'majors', icon: 'graduation', label: 'Ngành đào tạo' },
      { id: 'curriculum', icon: 'layers', label: 'Chương trình' },
      { id: 'courses', icon: 'book', label: 'Môn học' },
      { id: 'semesters', icon: 'calendar', label: 'Học kỳ' },
      { id: 'classes', icon: 'clipboard', label: 'Lớp học phần' },
      { id: 'registrations', icon: 'doc', label: 'Đăng ký', section: 'Vận hành' },
      { id: 'reports', icon: 'chart', label: 'Báo cáo' },
      { id: 'notifications', icon: 'megaphone', label: 'Thông báo' },
      { id: 'settings', icon: 'settings', label: 'Cấu hình', section: 'Hệ thống' },
    ],
    student: [
      { id: 'dashboard', icon: 'home', label: 'Trang chủ', section: '' },
      { id: 'register', icon: 'plus', label: 'Đăng ký môn', section: 'Học tập' },
      { id: 'auto', icon: 'sparkle', label: 'Tạo TKB tự động' },
      { id: 'schedule', icon: 'calendar', label: 'Thời khóa biểu' },
      { id: 'curriculum', icon: 'layers', label: 'Chương trình đào tạo' },
      { id: 'history', icon: 'clock', label: 'Lịch sử đăng ký' },
      { id: 'notifications', icon: 'bell', label: 'Thông báo', section: 'Khác' },
      { id: 'profile', icon: 'user', label: 'Hồ sơ' },
    ],
    teacher: [
      { id: 'dashboard', icon: 'home', label: 'Trang chủ', section: '' },
      { id: 'schedule', icon: 'calendar', label: 'Lịch dạy', section: 'Giảng dạy' },
      { id: 'classes', icon: 'clipboard', label: 'Lớp phụ trách' },
      { id: 'grades', icon: 'edit', label: 'Nhập điểm' },
      { id: 'notifications', icon: 'bell', label: 'Thông báo', section: 'Khác' },
      { id: 'profile', icon: 'user', label: 'Hồ sơ' },
    ],
  }[role] || [];

  const roleLabel = { admin: 'Quản trị viên', student: 'Sinh viên', teacher: 'Giáo viên' }[role];

  return (
    <aside style={{
      gridColumn: '1 / 2', gridRow: '1 / 3',
      background: 'var(--sidebarBg)',
      color: 'var(--sidebarText)',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* logo */}
      <div style={{
        height: 56, display: 'flex', alignItems: 'center',
        padding: collapsed ? 0 : '0 16px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10, borderBottom: '1px solid rgba(255,255,255,0.05)',
        flex: '0 0 auto',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: 'var(--accent)',
          color: '#fff', display: 'grid', placeItems: 'center',
          fontWeight: 700, fontSize: 13, fontFamily: 'IBM Plex Mono, monospace',
          letterSpacing: '-0.02em',
        }}>ĐK</div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.1 }}>ĐKMH</div>
            <div style={{ fontSize: 10.5, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{roleLabel}</div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, overflow: 'auto', padding: collapsed ? '12px 8px' : '12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(item => (
          <React.Fragment key={item.id}>
            {item.section && !collapsed && (
              <div style={{
                padding: '14px 8px 6px', fontSize: 10.5, textTransform: 'uppercase',
                color: '#64748b', letterSpacing: '0.08em', fontWeight: 600,
              }}>{item.section}</div>
            )}
            {item.section && collapsed && (
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 4px' }} />
            )}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: collapsed ? '9px' : '8px 10px',
              borderRadius: 8, cursor: 'pointer',
              fontSize: 13, fontWeight: active === item.id ? 600 : 500,
              background: active === item.id ? 'var(--sidebarActive)' : 'transparent',
              color: active === item.id ? '#fff' : 'var(--sidebarText)',
              justifyContent: collapsed ? 'center' : 'flex-start',
              position: 'relative',
            }}>
              <Icon name={item.icon} size={18} stroke={1.7} />
              {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
            </div>
          </React.Fragment>
        ))}
      </nav>

      {!collapsed && (
        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.05)', flex: '0 0 auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg,#475569,#0f172a)',
              display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 600, fontSize: 12,
            }}>NA</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, color: '#fff', fontWeight: 500, lineHeight: 1.2 }}>
                {role === 'admin' ? 'Nguyễn Văn An' : role === 'student' ? 'Trần Minh Anh' : 'TS. Lê Thị Bích'}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'IBM Plex Mono, monospace' }}>
                {role === 'admin' ? 'admin@dkmh.edu' : role === 'student' ? '21520001' : 'GV-0142'}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

// ─── TOP BAR ───────────────────────────────────────────────────────────────
const TopBar = ({ breadcrumbs = [], title, onCollapse, badges }) => (
  <header style={{
    gridColumn: '2 / 3', gridRow: '1 / 2',
    background: 'var(--card)',
    borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', padding: '0 20px 0 12px', gap: 16,
  }}>
    <button style={iconBtnStyle}>
      <Icon name="menu" size={18} />
    </button>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--textMuted)', minWidth: 0, flex: 1 }}>
      {breadcrumbs.map((b, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Icon name="chevronRight" size={14} style={{ color: 'var(--textFaint)' }} />}
          <span style={{
            color: i === breadcrumbs.length - 1 ? 'var(--text)' : 'var(--textMuted)',
            fontWeight: i === breadcrumbs.length - 1 ? 600 : 500,
            whiteSpace: 'nowrap',
          }}>{b}</span>
        </React.Fragment>
      ))}
    </div>
    {/* search */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 10px', borderRadius: 8,
      background: 'var(--surface)', border: '1px solid var(--border)',
      width: 280, color: 'var(--textMuted)',
    }}>
      <Icon name="search" size={15} />
      <span style={{ fontSize: 12.5 }}>Tìm môn học, lớp, sinh viên…</span>
      <span style={{
        marginLeft: 'auto', padding: '1px 5px',
        border: '1px solid var(--border)', borderRadius: 4,
        fontSize: 10.5, fontFamily: 'IBM Plex Mono, monospace',
      }}>⌘K</span>
    </div>
    <button style={{ ...iconBtnStyle, position: 'relative' }}>
      <Icon name="bell" size={18} />
      <span style={{
        position: 'absolute', top: 6, right: 6, width: 7, height: 7,
        borderRadius: '50%', background: 'var(--danger)', border: '2px solid var(--card)',
      }} />
    </button>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px 4px 4px', borderRadius: 999, border: '1px solid var(--border)' }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#475569,#0f172a)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600 }}>NA</div>
      <Icon name="chevronDown" size={14} style={{ color: 'var(--textMuted)' }} />
    </div>
  </header>
);

const iconBtnStyle = {
  width: 32, height: 32, borderRadius: 8, border: '1px solid transparent',
  background: 'transparent', color: 'var(--textMuted)', cursor: 'pointer',
  display: 'grid', placeItems: 'center', padding: 0,
};

// ─── PRIMITIVES ────────────────────────────────────────────────────────────
const PageTitle = ({ children, subtitle, action }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20, gap: 16 }}>
    <div style={{ flex: 1 }}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em', color: 'var(--text)' }}>{children}</h1>
      {subtitle && <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--textMuted)' }}>{subtitle}</p>}
    </div>
    {action && <div style={{ display: 'flex', gap: 8 }}>{action}</div>}
  </div>
);

const Card = ({ title, subtitle, action, children, pad = 20, style = {} }) => (
  <div style={{
    background: 'var(--card)', borderRadius: 12,
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow)',
    overflow: 'hidden',
    ...style,
  }}>
    {(title || action) && (
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {title && <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{title}</div>}
          {subtitle && <div style={{ fontSize: 12.5, color: 'var(--textMuted)', marginTop: 2 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
    )}
    <div style={{ padding: pad }}>{children}</div>
  </div>
);

const Button = ({ variant = 'secondary', size = 'md', icon, iconRight, children, style = {}, ...rest }) => {
  const pad = size === 'sm' ? '5px 10px' : size === 'lg' ? '10px 16px' : '7px 13px';
  const fontSize = size === 'sm' ? 12.5 : size === 'lg' ? 14 : 13;
  const variants = {
    primary: { background: 'var(--accent)', color: 'var(--accentText)', border: '1px solid var(--accent)' },
    secondary: { background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' },
    ghost: { background: 'transparent', color: 'var(--textMuted)', border: '1px solid transparent' },
    danger: { background: 'transparent', color: 'var(--danger)', border: '1px solid var(--border)' },
    soft: { background: 'var(--accentSoft)', color: 'var(--accent)', border: '1px solid transparent' },
  };
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: pad,
      borderRadius: 7, fontSize, fontWeight: 500, cursor: 'pointer',
      fontFamily: 'inherit', whiteSpace: 'nowrap',
      ...variants[variant], ...style,
    }} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 13 : 15} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 13 : 15} />}
    </button>
  );
};

const Badge = ({ tone = 'neutral', children, style = {} }) => {
  const tones = {
    neutral: { bg: 'var(--surface)', fg: 'var(--textMuted)' },
    accent: { bg: 'var(--accentSoft)', fg: 'var(--accent)' },
    success: { bg: 'rgba(22,163,74,.12)', fg: 'var(--success)' },
    warn: { bg: 'rgba(217,119,6,.13)', fg: 'var(--warn)' },
    danger: { bg: 'rgba(220,38,38,.12)', fg: 'var(--danger)' },
  };
  const t = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999,
      fontSize: 11.5, fontWeight: 500, lineHeight: 1.5,
      background: t.bg, color: t.fg, ...style,
    }}>{children}</span>
  );
};

const Stat = ({ label, value, delta, hint, icon, tone = 'neutral' }) => (
  <div style={{
    background: 'var(--card)', borderRadius: 12,
    border: '1px solid var(--border)', padding: 18,
    display: 'flex', flexDirection: 'column', gap: 8,
    boxShadow: 'var(--shadow)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {icon && (
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: tone === 'accent' ? 'var(--accentSoft)' : 'var(--surface)',
          color: tone === 'accent' ? 'var(--accent)' : 'var(--textMuted)',
          display: 'grid', placeItems: 'center',
        }}>
          <Icon name={icon} size={16} />
        </div>
      )}
      <span style={{ fontSize: 12.5, color: 'var(--textMuted)', fontWeight: 500 }}>{label}</span>
    </div>
    <div style={{ fontSize: 26, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
      {delta && (
        <span style={{
          color: delta.startsWith('-') ? 'var(--danger)' : 'var(--success)',
          fontWeight: 600,
        }}>{delta}</span>
      )}
      {hint && <span style={{ color: 'var(--textFaint)' }}>{hint}</span>}
    </div>
  </div>
);

const Input = ({ label, value, placeholder, prefix, suffix, hint, style = {} }) => (
  <label style={{ display: 'block', ...style }}>
    {label && <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>{label}</div>}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 11px', borderRadius: 8,
      background: 'var(--card)', border: '1px solid var(--border)',
      fontSize: 13,
    }}>
      {prefix && <span style={{ color: 'var(--textFaint)' }}>{prefix}</span>}
      <span style={{ flex: 1, color: value ? 'var(--text)' : 'var(--textFaint)' }}>{value || placeholder}</span>
      {suffix && <span style={{ color: 'var(--textFaint)' }}>{suffix}</span>}
    </div>
    {hint && <div style={{ fontSize: 11.5, color: 'var(--textFaint)', marginTop: 4 }}>{hint}</div>}
  </label>
);

const Select = ({ label, value, style = {} }) => (
  <label style={{ display: 'block', ...style }}>
    {label && <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>{label}</div>}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 11px', borderRadius: 8,
      background: 'var(--card)', border: '1px solid var(--border)',
      fontSize: 13,
    }}>
      <span style={{ flex: 1, color: 'var(--text)' }}>{value}</span>
      <Icon name="chevronDown" size={14} style={{ color: 'var(--textMuted)' }} />
    </div>
  </label>
);

// ─── TABLE ─────────────────────────────────────────────────────────────────
const Table = ({ columns, rows, dense = false, rowAction }) => (
  <div style={{ overflow: 'auto', borderRadius: 0 }}>
    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
      <thead>
        <tr>
          {columns.map((c, i) => (
            <th key={i} style={{
              textAlign: c.align || 'left',
              padding: dense ? '8px 12px' : '10px 14px',
              fontSize: 11.5, fontWeight: 600,
              color: 'var(--textMuted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              borderBottom: '1px solid var(--border)',
              background: 'var(--cardAlt)',
              whiteSpace: 'nowrap',
              ...c.thStyle,
            }}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={ri} style={{ background: ri % 2 ? 'transparent' : 'transparent' }}>
            {columns.map((c, ci) => (
              <td key={ci} style={{
                padding: dense ? '8px 12px' : '12px 14px',
                borderBottom: '1px solid var(--border)',
                textAlign: c.align || 'left',
                color: 'var(--text)',
                fontFamily: c.mono ? 'IBM Plex Mono, monospace' : 'inherit',
                fontSize: c.mono ? 12.5 : 13,
                whiteSpace: c.wrap ? 'normal' : 'nowrap',
                verticalAlign: 'middle',
                ...c.tdStyle,
              }}>
                {c.render ? c.render(r, ri) : r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── TABS ──────────────────────────────────────────────────────────────────
const Tabs = ({ items, active, style = {} }) => (
  <div style={{
    display: 'flex', gap: 4, borderBottom: '1px solid var(--border)',
    marginBottom: 16, ...style,
  }}>
    {items.map(i => (
      <div key={i.id} style={{
        padding: '9px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        color: active === i.id ? 'var(--text)' : 'var(--textMuted)',
        borderBottom: active === i.id ? '2px solid var(--accent)' : '2px solid transparent',
        marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {i.label}
        {i.count != null && (
          <span style={{
            padding: '0 6px', borderRadius: 999,
            background: active === i.id ? 'var(--accentSoft)' : 'var(--surface)',
            color: active === i.id ? 'var(--accent)' : 'var(--textMuted)',
            fontSize: 11, fontWeight: 600,
          }}>{i.count}</span>
        )}
      </div>
    ))}
  </div>
);

// ─── PILL / CHECKBOX / RADIO ──────────────────────────────────────────────
const Checkbox = ({ checked, label }) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
    <span style={{
      width: 16, height: 16, borderRadius: 4,
      border: '1.5px solid ' + (checked ? 'var(--accent)' : 'var(--borderStrong)'),
      background: checked ? 'var(--accent)' : 'var(--card)',
      display: 'grid', placeItems: 'center', color: '#fff',
    }}>
      {checked && <Icon name="check" size={11} stroke={2.5} />}
    </span>
    {label && <span style={{ color: 'var(--text)' }}>{label}</span>}
  </label>
);

const Radio = ({ checked, label }) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
    <span style={{
      width: 16, height: 16, borderRadius: '50%',
      border: '1.5px solid ' + (checked ? 'var(--accent)' : 'var(--borderStrong)'),
      display: 'grid', placeItems: 'center',
    }}>
      {checked && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />}
    </span>
    {label && <span style={{ color: 'var(--text)' }}>{label}</span>}
  </label>
);

// ─── SCHEDULE GRID ─────────────────────────────────────────────────────────
// reused by Student & Teacher TKB views and the auto-generator results.
const ScheduleGrid = ({ events = [], compact = false, dayLabels, periods }) => {
  const days = dayLabels || ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const slots = periods || [
    { id: 'm1', label: 'Sáng 1', time: '07:00' },
    { id: 'm2', label: 'Sáng 2', time: '09:00' },
    { id: 'a1', label: 'Chiều 1', time: '13:00' },
    { id: 'a2', label: 'Chiều 2', time: '15:00' },
    { id: 'e1', label: 'Tối', time: '18:00' },
  ];
  const rowH = compact ? 56 : 78;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `64px repeat(${days.length}, 1fr)`,
      gridTemplateRows: `28px repeat(${slots.length}, ${rowH}px)`,
      gap: 4,
      background: 'var(--surface)',
      padding: 8, borderRadius: 8,
      fontSize: compact ? 10.5 : 11.5,
    }}>
      <div />
      {days.map(d => (
        <div key={d} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11.5, fontWeight: 600, color: 'var(--textMuted)',
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>{d}</div>
      ))}
      {slots.map(s => (
        <React.Fragment key={s.id}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0 6px', fontSize: 10.5,
          }}>
            <div style={{ color: 'var(--text)', fontWeight: 600 }}>{s.label}</div>
            <div style={{ color: 'var(--textFaint)', fontFamily: 'IBM Plex Mono, monospace' }}>{s.time}</div>
          </div>
          {days.map((_, di) => {
            const ev = events.find(e => e.day === di && e.slot === s.id);
            return (
              <div key={di} style={{
                background: 'var(--card)', borderRadius: 6,
                border: '1px solid var(--border)',
                padding: 6, position: 'relative',
                overflow: 'hidden',
              }}>
                {ev && (
                  <div style={{
                    position: 'absolute', inset: 2,
                    background: ev.color || 'var(--accentSoft)',
                    borderLeft: '3px solid ' + (ev.accent || 'var(--accent)'),
                    borderRadius: 5,
                    padding: compact ? '4px 6px' : '6px 8px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    color: 'var(--text)',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: compact ? 10.5 : 12, lineHeight: 1.2 }}>{ev.title}</div>
                      <div style={{ fontSize: compact ? 9.5 : 10.5, color: 'var(--textMuted)', marginTop: 2, fontFamily: 'IBM Plex Mono, monospace' }}>{ev.code}</div>
                    </div>
                    {!compact && (
                      <div style={{ fontSize: 10.5, color: 'var(--textMuted)' }}>
                        <div>{ev.room}</div>
                        <div>{ev.teacher}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

// expose to other babel scripts
Object.assign(window, {
  Icon, AppShell, Sidebar, TopBar, iconBtnStyle,
  PageTitle, Card, Button, Badge, Stat, Input, Select,
  Table, Tabs, Checkbox, Radio, ScheduleGrid,
});
