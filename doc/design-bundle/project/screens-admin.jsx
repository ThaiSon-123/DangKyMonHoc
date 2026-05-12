/* eslint-disable react/prop-types */
/* Admin screens: Dashboard, Tài khoản, Lớp học phần, Báo cáo & thống kê,
   Thông báo, Học kỳ. */

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────
const AdminDashboard = () => (
  <>
    <PageTitle
      subtitle="HK2 · 2025–2026 · Đợt đăng ký mở · Cập nhật cách đây 2 phút"
      action={<>
        <Button variant="secondary" icon="download">Xuất báo cáo</Button>
        <Button variant="primary" icon="megaphone">Gửi thông báo</Button>
      </>}>
      Tổng quan vận hành
    </PageTitle>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 14 }}>
      <Stat label="Sinh viên đã đăng ký" value="11,492" hint="trên 12,840 SV" icon="users" tone="accent" delta="+842" />
      <Stat label="Lớp HP đang mở" value="486" hint="92 lớp đầy chỗ" icon="clipboard" delta="+12" />
      <Stat label="Tỷ lệ thành công" value="98.2%" hint="trùng lịch < 0.4%" icon="check" delta="+0.4%" />
      <Stat label="Yêu cầu xử lý" value="34" hint="hủy / đổi lớp" icon="bell" />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, marginBottom: 14 }}>
      <Card title="Số lượng đăng ký theo ngày" subtitle="07/05 → 12/05/2026" pad={14}
        action={<div style={{ display: 'flex', gap: 4 }}>
          {['7 ngày', '30 ngày', 'Học kỳ'].map((t, i) => (
            <div key={t} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 12,
              background: i === 0 ? 'var(--accentSoft)' : 'transparent',
              color: i === 0 ? 'var(--accent)' : 'var(--textMuted)',
              fontWeight: i === 0 ? 600 : 500, cursor: 'pointer',
            }}>{t}</div>
          ))}
        </div>}>
        {/* Chart */}
        <div style={{ height: 240, position: 'relative', padding: '0 6px' }}>
          <svg width="100%" height="100%" viewBox="0 0 700 240" preserveAspectRatio="none">
            {[0, 60, 120, 180].map(y => (
              <line key={y} x1="40" y1={20 + y * 0.9} x2="700" y2={20 + y * 0.9} stroke="var(--border)" strokeWidth="1" />
            ))}
            {[0, 2500, 5000, 7500].map((v, i) => (
              <text key={v} x="32" y={216 - i * 54} fontSize="10" fill="var(--textFaint)" textAnchor="end" fontFamily="IBM Plex Mono">{v}</text>
            ))}
            {['07/05', '08/05', '09/05', '10/05', '11/05', '12/05'].map((d, i) => (
              <text key={d} x={88 + i * 110} y="232" fontSize="10.5" fill="var(--textFaint)" textAnchor="middle">{d}</text>
            ))}
            {/* Bars */}
            {[1200, 2800, 3400, 4100, 5600, 6800].map((v, i) => (
              <rect key={i} x={64 + i * 110} y={216 - v * 0.026} width="48" height={v * 0.026} rx="3" fill="var(--accent)" opacity="0.85" />
            ))}
            {/* Line: cumulative */}
            <path d="M88,200 L198,170 L308,140 L418,108 L528,72 L638,40"
              fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
            {[88, 198, 308, 418, 528, 638].map((x, i) => (
              <circle key={i} cx={x} cy={[200, 170, 140, 108, 72, 40][i]} r="3.5" fill="var(--card)" stroke="var(--accent)" strokeWidth="2" />
            ))}
          </svg>
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 6, fontSize: 11.5, color: 'var(--textMuted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent)' }} /> Đăng ký mới
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 16, height: 2, background: 'var(--accent)', opacity: .6 }} /> Cộng dồn
          </span>
        </div>
      </Card>

      <Card title="Cảnh báo & xử lý" pad={0}>
        {[
          { tone: 'danger', icon: 'x', title: '92 lớp đầy chỗ', sub: 'Cần xem xét mở thêm lớp', cta: 'Xem' },
          { tone: 'warn', icon: 'clock', title: '24 SV chưa đăng ký đủ TC', sub: 'Dưới 12 tín chỉ tối thiểu', cta: 'Liên hệ' },
          { tone: 'warn', icon: 'users', title: '18 yêu cầu hủy đăng ký', sub: 'Chờ Admin duyệt', cta: 'Duyệt' },
          { tone: 'accent', icon: 'sparkle', title: 'Đề xuất gộp lớp ENG02 & ENG07', sub: 'Cả hai dưới 30% sĩ số', cta: 'Xem' },
        ].map((a, i) => (
          <div key={i} style={{ padding: '12px 16px', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 7,
              background: a.tone === 'danger' ? 'rgba(220,38,38,.12)' : a.tone === 'warn' ? 'rgba(217,119,6,.13)' : 'var(--accentSoft)',
              color: a.tone === 'danger' ? 'var(--danger)' : a.tone === 'warn' ? 'var(--warn)' : 'var(--accent)',
              display: 'grid', placeItems: 'center', flex: '0 0 auto',
            }}><Icon name={a.icon} size={15} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{a.title}</div>
              <div style={{ fontSize: 11.5, color: 'var(--textMuted)', marginTop: 1 }}>{a.sub}</div>
            </div>
            <Button size="sm" variant="ghost">{a.cta}</Button>
          </div>
        ))}
      </Card>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <Card title="Đăng ký theo ngành" pad={20}>
        <div style={{ display: 'grid', gap: 14 }}>
          {[
            ['Công nghệ Thông tin', 3245, 3520, '#1e3a5f'],
            ['Kỹ thuật Phần mềm', 2876, 3100, '#0f766e'],
            ['Hệ thống Thông tin', 1842, 2050, '#7c3aed'],
            ['Khoa học Máy tính', 2104, 2310, '#c2410c'],
            ['An toàn Thông tin', 1425, 1860, '#475569'],
          ].map(([name, val, tot, color]) => {
            const pct = Math.round(val / tot * 100);
            return (
              <div key={name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 500 }}>{name}</span>
                  <span style={{ color: 'var(--textMuted)', fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{val.toLocaleString()} / {tot.toLocaleString()} · {pct}%</span>
                </div>
                <div style={{ height: 7, background: 'var(--surface)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Hoạt động gần đây" pad={0}>
        <Table dense
          columns={[
            { key: 'time', label: 'Thời điểm', mono: true },
            { key: 'who', label: 'Người dùng', wrap: true },
            { key: 'action', label: 'Hoạt động', wrap: true },
          ]}
          rows={[
            { time: '14:22', who: 'SV 21520001', action: 'Đăng ký IT4409 — lớp 21CLC02' },
            { time: '14:18', who: 'admin@dkmh', action: 'Mở thêm lớp IT3090.04' },
            { time: '14:11', who: 'SV 21520142', action: 'Hủy đăng ký IT3070' },
            { time: '14:02', who: 'GV-0142', action: 'Cập nhật lịch dạy IT4409.02' },
            { time: '13:58', who: 'admin@dkmh', action: 'Gửi thông báo cho khoa CNTT' },
            { time: '13:40', who: 'SV 21520078', action: 'Đăng ký 6 môn qua TKB tự động' },
          ]}
        />
      </Card>
    </div>
  </>
);

// ─── QUẢN LÝ TÀI KHOẢN ────────────────────────────────────────────────────
const AdminAccounts = () => (
  <>
    <PageTitle
      subtitle="Quản lý tài khoản Sinh viên và Giáo viên. Admin không thể tạo tài khoản Admin khác."
      action={<>
        <Button variant="secondary" icon="upload">Nhập CSV</Button>
        <Button variant="primary" icon="plus">Thêm tài khoản</Button>
      </>}>
      Quản lý tài khoản
    </PageTitle>

    <Tabs items={[
      { id: 'all', label: 'Tất cả', count: 13284 },
      { id: 'stu', label: 'Sinh viên', count: 12840 },
      { id: 'tea', label: 'Giáo viên', count: 442 },
      { id: 'lock', label: 'Đang khóa', count: 17 },
    ]} active="all" />

    <Card pad={0}>
      <div style={{
        padding: '12px 14px', display: 'flex', gap: 8,
        borderBottom: '1px solid var(--border)', alignItems: 'center',
      }}>
        <Input value="Tìm theo tên, mã số, email..." prefix={<Icon name="search" size={13} />} style={{ flex: 1, maxWidth: 360 }} />
        <Select value="Tất cả ngành" style={{ width: 180 }} />
        <Select value="Tất cả niên khóa" style={{ width: 180 }} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <Button size="sm" variant="ghost" icon="filter">Lọc</Button>
          <Button size="sm" variant="ghost" icon="download">Xuất</Button>
        </div>
      </div>

      <Table
        columns={[
          { key: 'sel', label: '', render: () => <Checkbox /> },
          { key: 'id', label: 'Mã số', mono: true },
          { key: 'name', label: 'Họ và tên', wrap: true,
            render: r => <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: r.color, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600 }}>{r.ini}</div>
              <div>
                <div style={{ fontWeight: 500 }}>{r.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--textFaint)' }}>{r.email}</div>
              </div>
            </div> },
          { key: 'role', label: 'Vai trò', render: r => <Badge tone={r.role === 'Giáo viên' ? 'accent' : 'neutral'}>{r.role}</Badge> },
          { key: 'major', label: 'Ngành / Khoa' },
          { key: 'year', label: 'Niên khóa', mono: true },
          { key: 'status', label: 'Trạng thái', render: r => <Badge tone={r.statusTone}>{r.status}</Badge> },
          { key: 'last', label: 'Đăng nhập', mono: true },
          { key: 'act', label: '', align: 'right',
            render: () => <button style={iconBtnStyle}><Icon name="more" size={16} /></button> },
        ]}
        rows={[
          { id: '21520001', ini: 'TA', color: '#1e3a5f', name: 'Trần Minh Anh', email: 'anh.tm21@dkmh.edu', role: 'Sinh viên', major: 'CNTT — KHMT', year: 'K21', status: 'Hoạt động', statusTone: 'success', last: '14:22' },
          { id: '21520078', ini: 'NB', color: '#0f766e', name: 'Nguyễn Thị Bích', email: 'bich.nt21@dkmh.edu', role: 'Sinh viên', major: 'CNTT — KTPM', year: 'K21', status: 'Hoạt động', statusTone: 'success', last: '13:40' },
          { id: '20520142', ini: 'PC', color: '#7c3aed', name: 'Phạm Văn Cường', email: 'cuong.pv20@dkmh.edu', role: 'Sinh viên', major: 'CNTT — ATTT', year: 'K20', status: 'Hoạt động', statusTone: 'success', last: '12/05' },
          { id: '22520203', ini: 'LD', color: '#c2410c', name: 'Lê Khánh Duy', email: 'duy.lk22@dkmh.edu', role: 'Sinh viên', major: 'CNTT — HTTT', year: 'K22', status: 'Khóa', statusTone: 'danger', last: '03/05' },
          { id: 'GV-0142', ini: 'LB', color: '#475569', name: 'TS. Lê Thị Bích', email: 'bich.lt@dkmh.edu', role: 'Giáo viên', major: 'Khoa CNTT', year: '—', status: 'Hoạt động', statusTone: 'success', last: '14:02' },
          { id: 'GV-0089', ini: 'NT', color: '#1e3a5f', name: 'PGS. Nguyễn Tuấn', email: 'tuan.n@dkmh.edu', role: 'Giáo viên', major: 'Khoa CNTT', year: '—', status: 'Hoạt động', statusTone: 'success', last: '11:18' },
          { id: '23520455', ini: 'TE', color: '#0f766e', name: 'Trịnh Anh Em', email: 'em.ta23@dkmh.edu', role: 'Sinh viên', major: 'CNTT — KHMT', year: 'K23', status: 'Hoạt động', statusTone: 'success', last: '09:54' },
          { id: '21520088', ini: 'VG', color: '#7c3aed', name: 'Vũ Hồng Giang', email: 'giang.vh21@dkmh.edu', role: 'Sinh viên', major: 'CNTT — KTPM', year: 'K21', status: 'Chờ kích hoạt', statusTone: 'warn', last: '—' },
          { id: 'GV-0177', ini: 'PH', color: '#c2410c', name: 'TS. Phạm Hoa', email: 'hoa.p@dkmh.edu', role: 'Giáo viên', major: 'Khoa CNTT', year: '—', status: 'Hoạt động', statusTone: 'success', last: '14:00' },
        ]}
      />

      <div style={{
        padding: '12px 16px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 12.5, color: 'var(--textMuted)',
      }}>
        <span>Hiển thị 1 – 9 trong 13,284 tài khoản</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button style={iconBtnStyle}><Icon name="chevronLeft" size={15} /></button>
          {['1', '2', '3', '…', '1,476'].map((p, i) => (
            <div key={i} style={{
              minWidth: 28, height: 28, display: 'grid', placeItems: 'center',
              borderRadius: 6, fontSize: 12.5,
              background: i === 0 ? 'var(--accent)' : 'transparent',
              color: i === 0 ? '#fff' : 'var(--textMuted)',
              fontWeight: i === 0 ? 600 : 500, padding: '0 8px',
            }}>{p}</div>
          ))}
          <button style={iconBtnStyle}><Icon name="chevronRight" size={15} /></button>
        </div>
      </div>
    </Card>
  </>
);

// ─── QUẢN LÝ LỚP HỌC PHẦN ─────────────────────────────────────────────────
const AdminClasses = () => (
  <>
    <PageTitle
      subtitle="Tạo lớp · gán giáo viên · thiết lập lịch học, phòng học và sĩ số tối đa cho HK2 · 2025–2026"
      action={<>
        <Button variant="secondary" icon="upload">Nhập từ kỳ trước</Button>
        <Button variant="primary" icon="plus">Tạo lớp học phần</Button>
      </>}>
      Lớp học phần
    </PageTitle>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 14 }}>
      <Stat label="Tổng lớp HP" value="486" hint="HK2 · 25-26" icon="clipboard" />
      <Stat label="Đầy chỗ" value="92" hint="cần xem xét" icon="x" delta="+8" />
      <Stat label="Dưới 50% sĩ số" value="34" hint="đề xuất gộp" icon="users" />
      <Stat label="Tỷ lệ lấp đầy" value="76%" delta="+2.4%" icon="chart" tone="accent" />
    </div>

    <Card pad={0}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <Input value="Tìm môn, mã lớp, giáo viên..." prefix={<Icon name="search" size={13} />} style={{ flex: 1, maxWidth: 320 }} />
        <Select value="Khoa CNTT" style={{ width: 160 }} />
        <Select value="HK2 · 25-26" style={{ width: 160 }} />
        <Select value="Tất cả trạng thái" style={{ width: 180 }} />
      </div>
      <Table
        columns={[
          { key: 'sel', label: '', render: () => <Checkbox /> },
          { key: 'class', label: 'Mã lớp', mono: true,
            render: r => <div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12.5, fontWeight: 600 }}>{r.class}</div>
              <div style={{ fontSize: 11, color: 'var(--textFaint)' }}>{r.code}</div>
            </div> },
          { key: 'name', label: 'Môn học', wrap: true },
          { key: 'teacher', label: 'Giáo viên', wrap: true },
          { key: 'sched', label: 'Lịch học' },
          { key: 'room', label: 'Phòng', mono: true },
          { key: 'cap', label: 'Sĩ số', align: 'right',
            render: r => <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{r.cap}</span>
              <div style={{ width: 56, height: 5, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: r.pct + '%', height: '100%', background: r.pct >= 95 ? 'var(--danger)' : r.pct >= 75 ? 'var(--warn)' : 'var(--accent)' }} />
              </div>
            </div> },
          { key: 'status', label: 'Trạng thái', render: r => <Badge tone={r.statusTone}>{r.status}</Badge> },
          { key: 'act', label: '', align: 'right',
            render: () => <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
              <button style={iconBtnStyle}><Icon name="edit" size={15} /></button>
              <button style={iconBtnStyle}><Icon name="more" size={16} /></button>
            </div> },
        ]}
        rows={[
          { class: '21CLC01', code: 'IT4409', name: 'Lập trình Web nâng cao', teacher: 'PGS. Nguyễn Tuấn', sched: 'T2 · 7:00 — T4 · 13:00', room: 'D9-302', cap: '60/60', pct: 100, status: 'Đầy', statusTone: 'danger' },
          { class: '21CLC02', code: 'IT4409', name: 'Lập trình Web nâng cao', teacher: 'TS. Lê Thị Bích', sched: 'T2 · 7:00 — T4 · 15:00', room: 'D9-204', cap: '38/60', pct: 63, status: 'Đang mở', statusTone: 'success' },
          { class: '21CLC03', code: 'IT4409', name: 'Lập trình Web nâng cao', teacher: 'ThS. Trần Quân', sched: 'T3 · 13:00 — T5 · 9:00', room: 'B1-501', cap: '58/60', pct: 96, status: 'Sắp đầy', statusTone: 'warn' },
          { class: '21CLC01', code: 'IT4063', name: 'Trí tuệ nhân tạo', teacher: 'PGS. Nguyễn Tuấn', sched: 'T2 · 13:00 — T6 · 9:00', room: 'D9-302', cap: '52/60', pct: 86, status: 'Đang mở', statusTone: 'success' },
          { class: '21CLC02', code: 'IT4063', name: 'Trí tuệ nhân tạo', teacher: 'TS. Hoàng Nam', sched: 'T3 · 7:00 — T5 · 13:00', room: 'D9-201', cap: '44/60', pct: 73, status: 'Đang mở', statusTone: 'success' },
          { class: '21CLC03', code: 'IT3090', name: 'Cơ sở dữ liệu', teacher: 'TS. Phạm Hoa', sched: 'T4 · 9:00 — T6 · 13:00', room: 'B1-501', cap: '60/60', pct: 100, status: 'Đầy', statusTone: 'danger' },
          { class: '21CLC04', code: 'IT3070', name: 'Hệ điều hành', teacher: 'ThS. Đỗ Long', sched: 'T5 · 7:00 — T7 · 9:00', room: 'D9-105', cap: '12/60', pct: 20, status: 'Thiếu SV', statusTone: 'warn' },
          { class: 'EN02', code: 'EN3270', name: 'Anh văn chuyên ngành', teacher: 'Ms. Williams', sched: 'T7 · 7:00', room: 'F2-201', cap: '24/40', pct: 60, status: 'Đang mở', statusTone: 'success' },
        ]}
      />
    </Card>
  </>
);

// ─── BÁO CÁO & THỐNG KÊ ───────────────────────────────────────────────────
const AdminReports = () => (
  <>
    <PageTitle
      subtitle="Tổng hợp số liệu đăng ký, sĩ số lớp và phân bố theo ngành cho HK2 · 2025–2026"
      action={<>
        <Select value="HK2 · 2025–2026" style={{ width: 180 }} />
        <Button variant="secondary" icon="download">Excel</Button>
        <Button variant="primary" icon="download">PDF</Button>
      </>}>
      Báo cáo & thống kê
    </PageTitle>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 14 }}>
      <Stat label="Tổng tín chỉ đăng ký" value="184,260" hint="trung bình 16.0 / SV" icon="layers" delta="+8.4%" />
      <Stat label="Lớp đầy chỗ" value="92 / 486" hint="19% tổng số lớp" icon="users" />
      <Stat label="Sinh viên hoàn tất" value="11,492" hint="89.5% toàn trường" icon="check" tone="accent" delta="+842" />
      <Stat label="Yêu cầu xử lý thủ công" value="34" hint="sĩ số / điều phối" icon="bell" />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
      <Card title="Top 10 môn học đăng ký nhiều nhất" subtitle="Theo số sinh viên đăng ký" pad={0}>
        <Table dense
          columns={[
            { key: 'rank', label: '#', mono: true, align: 'center' },
            { key: 'code', label: 'Mã', mono: true },
            { key: 'name', label: 'Tên môn', wrap: true },
            { key: 'sec', label: 'Lớp', align: 'center' },
            { key: 'reg', label: 'Đăng ký', align: 'right',
              render: r => <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 600 }}>{r.reg}</span>
                <div style={{ width: 60, height: 5, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: r.pct + '%', height: '100%', background: 'var(--accent)' }} />
                </div>
              </div> },
          ]}
          rows={[
            { rank: 1, code: 'IT4409', name: 'Lập trình Web nâng cao', sec: 4, reg: 218, pct: 100 },
            { rank: 2, code: 'IT4063', name: 'Trí tuệ nhân tạo', sec: 3, reg: 196, pct: 90 },
            { rank: 3, code: 'IT3090', name: 'Cơ sở dữ liệu', sec: 5, reg: 184, pct: 84 },
            { rank: 4, code: 'EN3270', name: 'Anh văn chuyên ngành', sec: 6, reg: 162, pct: 74 },
            { rank: 5, code: 'IT3070', name: 'Hệ điều hành', sec: 3, reg: 148, pct: 68 },
            { rank: 6, code: 'IT4282', name: 'Phát triển ứng dụng di động', sec: 2, reg: 122, pct: 56 },
            { rank: 7, code: 'IT4566', name: 'An toàn thông tin', sec: 2, reg: 106, pct: 49 },
            { rank: 8, code: 'IT4593', name: 'Kiểm thử phần mềm', sec: 2, reg: 94, pct: 43 },
          ]}
        />
      </Card>

      <Card title="Phân bố sĩ số lớp" subtitle="486 lớp học phần · HK2" pad={20}>
        <div style={{ display: 'grid', gap: 14 }}>
          {[
            ['0–30% (thiếu SV)', 34, 'var(--warn)'],
            ['30–60%', 92, 'var(--textMuted)'],
            ['60–90% (lý tưởng)', 268, 'var(--accent)'],
            ['90–100% (sắp đầy)', 92, '#c2410c'],
          ].map(([label, val, color]) => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ fontWeight: 500 }}>{label}</span>
                <span style={{ color: 'var(--textMuted)', fontFamily: 'IBM Plex Mono' }}>{val} lớp · {Math.round(val/486*100)}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--surface)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: (val/486*100) + '%', height: '100%', background: color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
        {/* Donut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 24, padding: 16, background: 'var(--cardAlt)', borderRadius: 10 }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="38" fill="none" stroke="var(--surface)" strokeWidth="14" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="var(--accent)" strokeWidth="14"
              strokeDasharray={`${0.76 * 239} 239`} transform="rotate(-90 50 50)" strokeLinecap="round" />
          </svg>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--textMuted)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>Tỷ lệ lấp đầy chung</div>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>76.4%</div>
            <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>+ 2.4% so với HK1</div>
          </div>
        </div>
      </Card>
    </div>

    <Card title="Phân bố đăng ký theo ngành & niên khóa" subtitle="Số sinh viên đăng ký / tổng số" pad={0}>
      <Table dense
        columns={[
          { key: 'major', label: 'Ngành', wrap: true },
          { key: 'k20', label: 'K20', align: 'right', mono: true },
          { key: 'k21', label: 'K21', align: 'right', mono: true },
          { key: 'k22', label: 'K22', align: 'right', mono: true },
          { key: 'k23', label: 'K23', align: 'right', mono: true },
          { key: 'total', label: 'Tổng', align: 'right',
            render: r => <span style={{ fontWeight: 600, fontFamily: 'IBM Plex Mono' }}>{r.total}</span> },
          { key: 'pct', label: 'Hoàn tất', align: 'right',
            render: r => <Badge tone={r.pct >= 90 ? 'success' : r.pct >= 80 ? 'accent' : 'warn'}>{r.pct}%</Badge> },
        ]}
        rows={[
          { major: 'Công nghệ Thông tin (CNTT)', k20: '742', k21: '824', k22: '856', k23: '823', total: '3,245', pct: 92 },
          { major: 'Kỹ thuật Phần mềm (KTPM)', k20: '680', k21: '742', k22: '724', k23: '730', total: '2,876', pct: 93 },
          { major: 'Hệ thống Thông tin (HTTT)', k20: '432', k21: '462', k22: '486', k23: '462', total: '1,842', pct: 90 },
          { major: 'Khoa học Máy tính (KHMT)', k20: '512', k21: '534', k22: '526', k23: '532', total: '2,104', pct: 91 },
          { major: 'An toàn Thông tin (ATTT)', k20: '342', k21: '358', k22: '362', k23: '363', total: '1,425', pct: 77 },
        ]}
      />
    </Card>
  </>
);

// ─── GỬI THÔNG BÁO ────────────────────────────────────────────────────────
const AdminNotifications = () => (
  <>
    <PageTitle
      subtitle="Soạn và gửi thông báo cho Sinh viên hoặc Giáo viên · theo ngành, lớp hoặc cá nhân"
      action={<Button variant="secondary" icon="clock">Lịch gửi</Button>}>
      Gửi thông báo
    </PageTitle>

    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
      <Card title="Soạn thông báo mới" pad={20}>
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 6 }}>Đối tượng nhận</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'stu', label: 'Sinh viên', active: true },
                { id: 'tea', label: 'Giáo viên', active: false },
                { id: 'both', label: 'Cả hai', active: false },
              ].map(t => (
                <div key={t.id} style={{
                  padding: '7px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  border: '1px solid ' + (t.active ? 'var(--accent)' : 'var(--border)'),
                  background: t.active ? 'var(--accentSoft)' : 'var(--card)',
                  color: t.active ? 'var(--accent)' : 'var(--text)',
                }}>{t.label}</div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Select label="Phạm vi" value="Theo ngành" />
            <Select label="Lựa chọn" value="CNTT · K21 (824 SV)" />
          </div>

          <Input label="Tiêu đề" value="Lịch học IT4409 lớp 21CLC02 thay đổi" />

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 6 }}>Nội dung</div>
            <div style={{
              minHeight: 140, padding: 12, fontSize: 13, lineHeight: 1.6,
              borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)',
              color: 'var(--text)',
            }}>
              Kính gửi các bạn sinh viên lớp 21CLC02 môn IT4409 — Lập trình Web nâng cao,<br/><br/>
              Phòng đào tạo thông báo: từ tuần 16 (19/05), lịch học sẽ chuyển sang phòng <strong>D9-301</strong> thay vì D9-204 do trùng lịch bảo trì. Các nội dung khác giữ nguyên.<br/><br/>
              Trân trọng,<br/>
              <span style={{ color: 'var(--textMuted)' }}>Phòng Đào tạo</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Badge tone="accent">Mức độ: Quan trọng</Badge>
            <Badge tone="neutral">Gửi push + email</Badge>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <Button variant="ghost">Lưu nháp</Button>
              <Button variant="secondary" icon="clock">Lên lịch</Button>
              <Button variant="primary" icon="megaphone">Gửi ngay</Button>
            </span>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
        <Card title="Mẫu thông báo" pad={0}>
          {[
            { ic: 'clock', t: 'Mở đợt đăng ký môn học' },
            { ic: 'x', t: 'Đóng đợt đăng ký môn học' },
            { ic: 'calendar', t: 'Thay đổi lịch học lớp HP' },
            { ic: 'pin', t: 'Đổi phòng học' },
            { ic: 'megaphone', t: 'Thông báo chung từ phòng đào tạo' },
          ].map((tpl, i) => (
            <div key={i} style={{
              padding: '11px 16px', borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            }}>
              <Icon name={tpl.ic} size={15} style={{ color: 'var(--textMuted)' }} />
              <span style={{ fontSize: 13, flex: 1 }}>{tpl.t}</span>
              <Icon name="chevronRight" size={14} style={{ color: 'var(--textFaint)' }} />
            </div>
          ))}
        </Card>

        <Card title="Đã gửi gần đây" pad={0}>
          {[
            { t: 'Mở đợt đăng ký HK2 25-26', who: 'Toàn trường · 12,840 SV', when: '07/05 · 09:00', tone: 'success' },
            { t: 'Mở thêm lớp IT3090.04', who: 'CNTT · K21 · 824 SV', when: '11/05 · 14:18', tone: 'accent' },
            { t: 'Lịch nghỉ lễ 30/04 — 01/05', who: 'Toàn trường', when: '28/04 · 16:00', tone: 'neutral' },
          ].map((n, i) => (
            <div key={i} style={{ padding: '11px 16px', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>{n.t}</span>
                <Badge tone={n.tone}>Đã gửi</Badge>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--textMuted)', marginTop: 3 }}>{n.who} · {n.when}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  </>
);

// ─── QUẢN LÝ HỌC KỲ ───────────────────────────────────────────────────────
const AdminSemesters = () => (
  <>
    <PageTitle
      subtitle="Tạo học kỳ, cấu hình thời gian đăng ký môn học và đóng/mở học kỳ"
      action={<Button variant="primary" icon="plus">Tạo học kỳ mới</Button>}>
      Học kỳ
    </PageTitle>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
      {[
        { id: 'HK2 · 25-26', state: 'Đang mở', tone: 'success', range: '03/02/2026 → 30/06/2026',
          reg: 'Đăng ký môn: 07/05 → 23/05', regOpen: true, weeks: 22, courses: 142, classes: 486, students: 12840 },
        { id: 'HK1 · 25-26', state: 'Đã đóng', tone: 'neutral', range: '01/09/2025 → 15/01/2026',
          reg: 'Đăng ký môn: 12/08 → 25/08', regOpen: false, weeks: 20, courses: 138, classes: 462, students: 12604 },
        { id: 'HK Hè · 25-26', state: 'Đã lên lịch', tone: 'accent', range: '01/07/2026 → 28/08/2026',
          reg: 'Đăng ký môn: 20/06 → 28/06', regOpen: false, weeks: 8, courses: 36, classes: 84, students: '~2,400 (dự kiến)' },
      ].map(s => (
        <div key={s.id} style={{
          background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)', padding: 20,
          borderTop: '3px solid ' + (s.tone === 'success' ? 'var(--success)' : s.tone === 'accent' ? 'var(--accent)' : 'var(--borderStrong)'),
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{s.id}</div>
            <Badge tone={s.tone}>{s.state}</Badge>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--textMuted)', marginTop: 4, fontFamily: 'IBM Plex Mono' }}>{s.range}</div>

          <div style={{
            marginTop: 16, padding: 12, borderRadius: 8,
            background: s.regOpen ? 'var(--accentSoft)' : 'var(--cardAlt)',
            border: '1px solid ' + (s.regOpen ? 'var(--accent)' : 'var(--border)'),
          }}>
            <div style={{ fontSize: 11, color: s.regOpen ? 'var(--accent)' : 'var(--textMuted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              {s.regOpen ? 'Đang mở đăng ký' : 'Đăng ký đã đóng'}
            </div>
            <div style={{ fontSize: 12.5, marginTop: 3, color: 'var(--text)', fontFamily: 'IBM Plex Mono' }}>{s.reg}</div>
          </div>

          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, fontSize: 12 }}>
            {[
              ['Số tuần', s.weeks],
              ['Môn học', s.courses],
              ['Lớp HP', s.classes],
              ['Sinh viên', s.students],
            ].map(([l, v]) => (
              <div key={l}>
                <div style={{ color: 'var(--textFaint)', fontSize: 11 }}>{l}</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <Button size="sm" variant="secondary" style={{ flex: 1, justifyContent: 'center' }}>Xem chi tiết</Button>
            <Button size="sm" variant="ghost" icon="settings">Cấu hình</Button>
          </div>
        </div>
      ))}
    </div>

    <Card title="Lịch sử học kỳ" subtitle="Tất cả học kỳ đã tạo" style={{ marginTop: 14 }} pad={0}>
      <Table dense
        columns={[
          { key: 'id', label: 'Học kỳ', mono: true },
          { key: 'range', label: 'Thời gian', mono: true },
          { key: 'students', label: 'SV', align: 'right', mono: true },
          { key: 'classes', label: 'Lớp HP', align: 'right', mono: true },
          { key: 'reg', label: 'Hoàn tất đăng ký', align: 'right' },
          { key: 'state', label: 'Trạng thái', render: r => <Badge tone={r.tone}>{r.state}</Badge> },
        ]}
        rows={[
          { id: 'HK2 · 25-26', range: '03/02 → 30/06/2026', students: '12,840', classes: 486, reg: '89.5%', state: 'Đang mở', tone: 'success' },
          { id: 'HK1 · 25-26', range: '01/09/2025 → 15/01/2026', students: '12,604', classes: 462, reg: '98.7%', state: 'Đã đóng', tone: 'neutral' },
          { id: 'HK Hè · 24-25', range: '01/07 → 28/08/2025', students: '2,184', classes: 76, reg: '100%', state: 'Đã đóng', tone: 'neutral' },
          { id: 'HK2 · 24-25', range: '03/02 → 30/06/2025', students: '12,420', classes: 458, reg: '98.2%', state: 'Đã đóng', tone: 'neutral' },
        ]}
      />
    </Card>
  </>
);

Object.assign(window, { AdminDashboard, AdminAccounts, AdminClasses, AdminReports, AdminNotifications, AdminSemesters });
