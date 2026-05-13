/* eslint-disable react/prop-types */
/* Auth / Login screens — 3 trang riêng cho Sinh viên / Giáo viên / Quản trị. */

const ROLE_CONFIG = {
  student: {
    label: 'Sinh viên',
    eyebrow: 'Cổng sinh viên',
    headline: ['Đăng ký môn học,', 'không còn áp lực.'],
    blurb: 'Tạo thời khóa biểu tự động theo ưu tiên giáo viên · ngày học · ca học. Kiểm tra trùng lịch, môn tiên quyết và tín chỉ trong thời gian thực.',
    idLabel: 'Mã số sinh viên',
    idValue: '21520001',
    idHint: '@dkmh.edu',
    icon: 'graduation',
    ctaText: 'Đăng nhập cổng Sinh viên',
    stats: [['12,840', 'Sinh viên'], ['486', 'Lớp học phần'], ['98.2%', 'Đăng ký thành công']],
    help: 'Cần trợ giúp? Liên hệ phòng đào tạo',
    accentGrad: ['#0e1c33', '#1e3a5f', '#2a4d7f'],
  },
  teacher: {
    label: 'Giáo viên',
    eyebrow: 'Cổng giảng viên',
    headline: ['Quản lý lớp giảng dạy,', 'tập trung vào sinh viên.'],
    blurb: 'Theo dõi lịch dạy cá nhân, danh sách lớp phụ trách và nhập điểm trực tuyến. Đề xuất đổi lịch và gửi thông báo lớp ngay trên hệ thống.',
    idLabel: 'Mã giảng viên / Email',
    idValue: 'lebich@dkmh.edu',
    idHint: '',
    icon: 'book',
    ctaText: 'Đăng nhập cổng Giáo viên',
    stats: [['1,240', 'Giảng viên'], ['486', 'Lớp HP đang dạy'], ['12h', 'Trung bình / tuần']],
    help: 'Vấn đề tài khoản? Liên hệ phòng tổ chức cán bộ',
    accentGrad: ['#0a1f2e', '#0f5060', '#137a8a'],
  },
  admin: {
    label: 'Quản trị viên',
    eyebrow: 'Cổng quản trị',
    headline: ['Vận hành đăng ký', 'toàn trường mượt mà.'],
    blurb: 'Quản lý ngành đào tạo, học kỳ, lớp học phần và tài khoản người dùng. Báo cáo thống kê và gửi thông báo cho toàn hệ thống.',
    idLabel: 'Tài khoản quản trị',
    idValue: 'admin.daotao',
    idHint: '',
    icon: 'settings',
    ctaText: 'Đăng nhập cổng Quản trị',
    stats: [['12,840', 'Người dùng'], ['486', 'Lớp HP / kỳ'], ['99.97%', 'Uptime hệ thống']],
    help: 'Truy cập cấp cao — yêu cầu xác thực 2 lớp.',
    accentGrad: ['#1a0e2e', '#3d1e6b', '#5d2ea3'],
    twoFactor: true,
  },
};

const AuthLogin = ({ role = 'student', dark, accent }) => {
  const cfg = ROLE_CONFIG[role];

  const bgVars = dark ? {
    '--bg': '#0b1220', '--card': '#13213a', '--surface': '#0f1a2e',
    '--text': '#e8eef7', '--textMuted': '#94a3b8', '--textFaint': '#64748b',
    '--border': '#1f3050', '--borderStrong': '#2a3f64',
    '--shadow': '0 12px 40px rgba(0,0,0,.45)', '--hover': 'rgba(255,255,255,.04)',
    '--accent': accent, '--accentSoft': accent + '22', '--accentText': '#fff',
    '--success': '#22c55e',
  } : {
    '--bg': '#f6f8fb', '--card': '#ffffff', '--surface': '#eef2f7',
    '--text': '#0f172a', '--textMuted': '#475569', '--textFaint': '#94a3b8',
    '--border': '#e4e9f1', '--borderStrong': '#cbd5e1',
    '--shadow': '0 1px 0 rgba(255,255,255,.6) inset, 0 12px 32px rgba(15,23,42,.08)',
    '--hover': 'rgba(15,23,42,.04)',
    '--accent': accent, '--accentSoft': accent + '14', '--accentText': '#fff',
    '--success': '#16a34a',
  };

  const grad = dark
    ? `radial-gradient(120% 80% at 20% 10%, ${cfg.accentGrad[1]} 0%, #0a1426 60%)`
    : `linear-gradient(155deg, ${cfg.accentGrad[0]} 0%, ${cfg.accentGrad[1]} 60%, ${cfg.accentGrad[2]} 100%)`;

  return (
    <div style={{
      ...bgVars,
      width: '100%', height: '100%',
      background: 'var(--bg)',
      fontFamily: '"IBM Plex Sans",system-ui,sans-serif',
      color: 'var(--text)',
      display: 'grid',
      gridTemplateColumns: '1fr 560px',
      overflow: 'hidden',
    }}>
      {/* Left brand pane */}
      <div style={{
        position: 'relative',
        background: grad,
        color: '#fff', padding: 56,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(120% 100% at 30% 30%, #000 0%, transparent 70%)',
        }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: accent, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontFamily: 'IBM Plex Mono', fontSize: 16 }}>ĐK</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>ĐKMH</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.55)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Hệ thống đăng ký môn học</div>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 11.5, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase',
            padding: '6px 12px', borderRadius: 999,
            background: 'rgba(255,255,255,.08)', color: '#fff',
            border: '1px solid rgba(255,255,255,.15)', marginBottom: 18,
          }}>
            <Icon name={cfg.icon} size={13} /> {cfg.eyebrow}
          </div>
          <h1 style={{ margin: 0, fontSize: 44, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            {cfg.headline[0]}<br />
            <span style={{ color: 'rgba(255,255,255,.55)' }}>{cfg.headline[1]}</span>
          </h1>
          <p style={{ marginTop: 18, maxWidth: 480, fontSize: 14.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.55 }}>
            {cfg.blurb}
          </p>

          <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(3,auto)', gap: 32 }}>
            {cfg.stats.map(([v, l]) => (
              <div key={l}>
                <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{v}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.55)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,.45)' }}>
          <span>Phiên bản 2.4.1 · {cfg.label}</span>
          <span style={{ fontFamily: 'IBM Plex Mono' }}>SRS-DKMH v0.2</span>
        </div>
      </div>

      {/* Right form */}
      <div style={{
        background: 'var(--bg)', padding: 56, display: 'flex',
        flexDirection: 'column', justifyContent: 'center', gap: 24,
      }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase' }}>Đăng nhập · {cfg.label}</div>
          <h2 style={{ margin: '8px 0 4px', fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>Chào bạn quay lại</h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--textMuted)' }}>Đăng nhập bằng tài khoản nhà trường để tiếp tục.</p>
        </div>

        {/* Role indicator (locked) */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: 14, borderRadius: 10,
          border: '1px solid var(--accent)',
          background: 'var(--accentSoft)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--accent)', color: '#fff',
            display: 'grid', placeItems: 'center',
          }}>
            <Icon name={cfg.icon} size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Cổng {cfg.label}</div>
            <div style={{ fontSize: 11.5, color: 'var(--textMuted)' }}>Truy cập đúng vai trò để xem chức năng dành riêng</div>
          </div>
          <a style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, textDecoration: 'none', cursor: 'pointer' }}>Đổi cổng</a>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <Input label={cfg.idLabel} value={cfg.idValue + (cfg.idHint || '')} prefix={<Icon name="user" size={15} style={{ color: 'var(--textFaint)' }} />} />
          <Input label="Mật khẩu" value="••••••••••" suffix={<Icon name="lock" size={15} style={{ color: 'var(--textFaint)' }} />} />
          {cfg.twoFactor && (
            <Input label="Mã xác thực 2 lớp (OTP)" value="• • • • • •" prefix={<Icon name="shield" size={15} style={{ color: 'var(--textFaint)' }} />} />
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
            <Checkbox checked label="Ghi nhớ thiết bị này" />
            <a style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>Quên mật khẩu?</a>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <Button variant="primary" size="lg" iconRight="arrowRight" style={{ justifyContent: 'center', width: '100%' }}>
            {cfg.ctaText}
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--textFaint)', fontSize: 11.5 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span>HOẶC</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <Button variant="secondary" size="lg" icon="building" style={{ justifyContent: 'center', width: '100%' }}>
            SSO Tài khoản Nhà trường
          </Button>
        </div>

        <div style={{ fontSize: 12, color: 'var(--textFaint)', textAlign: 'center' }}>
          {cfg.help}
        </div>
      </div>
    </div>
  );
};

window.AuthLogin = AuthLogin;
