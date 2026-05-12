/* eslint-disable react/prop-types */
/* Student screens: Dashboard, Đăng ký thủ công, Tạo TKB tự động (compare),
   Xem TKB tuần/học kỳ, Lịch sử đăng ký, Chương trình đào tạo. */

// ─── DASHBOARD ─────────────────────────────────────────────────────────────
const StudentDashboard = () => (
  <>
    <PageTitle
      subtitle="Học kỳ 2 · Năm học 2025–2026 · Đợt đăng ký mở đến 23/05/2026"
      action={<>
        <Button variant="secondary" icon="download">Xuất TKB</Button>
        <Button variant="primary" icon="sparkle">Tạo TKB tự động</Button>
      </>}>
      Xin chào, Minh Anh
    </PageTitle>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
      <Stat label="Tín chỉ đã đăng ký" value="18" hint="trên tối đa 24" icon="layers" tone="accent" delta="+3" />
      <Stat label="Môn đã đăng ký" value="6" hint="học kỳ này" icon="book" />
      <Stat label="Tiến độ CTĐT" value="68%" hint="103 / 152 tín chỉ" icon="chart" delta="+9" />
      <Stat label="GPA tích lũy" value="3.42" hint="thang điểm 4" icon="graduation" />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 14 }}>
      <Card title="Thời khóa biểu tuần này" subtitle="12 – 18 / 05 / 2026" action={<Button size="sm" variant="ghost" iconRight="arrowRight">Xem đầy đủ</Button>} pad={14}>
        <ScheduleGrid compact events={[
          { day: 0, slot: 'm1', title: 'Lập trình Web', code: 'IT4409', accent: '#1e3a5f', color: 'rgba(30,58,95,.10)' },
          { day: 0, slot: 'a1', title: 'Trí tuệ nhân tạo', code: 'IT4063', accent: '#0f766e', color: 'rgba(15,118,110,.10)' },
          { day: 2, slot: 'm2', title: 'Cơ sở dữ liệu', code: 'IT3090', accent: '#7c3aed', color: 'rgba(124,58,237,.10)' },
          { day: 2, slot: 'a2', title: 'Lập trình Web', code: 'IT4409', accent: '#1e3a5f', color: 'rgba(30,58,95,.10)' },
          { day: 3, slot: 'm1', title: 'Hệ điều hành', code: 'IT3070', accent: '#c2410c', color: 'rgba(194,65,12,.10)' },
          { day: 4, slot: 'a1', title: 'Kiểm thử PM', code: 'IT4593', accent: '#1e3a5f', color: 'rgba(30,58,95,.10)' },
          { day: 5, slot: 'm1', title: 'Anh văn CN', code: 'EN3270', accent: '#475569', color: 'rgba(71,85,105,.10)' },
        ]} />
      </Card>

      <Card title="Cần lưu ý" pad={0}>
        <div style={{ display: 'grid' }}>
          {[
            { tone: 'warn', icon: 'clock', title: 'Đợt đăng ký đóng trong 4 ngày', sub: 'Hạn chót 23/05/2026 · 23:59' },
            { tone: 'accent', icon: 'sparkle', title: '3 phương án TKB phù hợp', sub: 'Dựa trên ưu tiên thứ 2, thứ 4 nghỉ' },
            { tone: 'success', icon: 'check', title: 'Đăng ký Lập trình Web thành công', sub: 'Lớp 21CLC02 · 12/05 · 14:22' },
            { tone: 'danger', icon: 'x', title: 'Trùng lịch: IT3090 & IT3070', sub: 'Thứ 4 · Sáng 2 — cần xử lý' },
          ].map((n, i) => (
            <div key={i} style={{
              padding: '12px 16px', display: 'flex', gap: 10,
              borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: n.tone === 'accent' ? 'var(--accentSoft)'
                          : n.tone === 'success' ? 'rgba(22,163,74,.12)'
                          : n.tone === 'warn'    ? 'rgba(217,119,6,.13)'
                                                 : 'rgba(220,38,38,.12)',
                color: n.tone === 'accent' ? 'var(--accent)'
                     : n.tone === 'success' ? 'var(--success)'
                     : n.tone === 'warn'    ? 'var(--warn)'
                                            : 'var(--danger)',
                display: 'grid', placeItems: 'center', flex: '0 0 auto',
              }}><Icon name={n.icon} size={15} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{n.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--textMuted)', marginTop: 2 }}>{n.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>

    <Card title="Môn học đã đăng ký kỳ này" action={<Button size="sm" variant="ghost" iconRight="arrowRight">Quản lý đăng ký</Button>} pad={0}>
      <Table
        columns={[
          { key: 'code', label: 'Mã môn', mono: true },
          { key: 'name', label: 'Tên môn học', wrap: true },
          { key: 'class', label: 'Lớp HP', mono: true },
          { key: 'tc', label: 'TC', align: 'center' },
          { key: 'teacher', label: 'Giáo viên' },
          { key: 'sched', label: 'Lịch học' },
          { key: 'status', label: 'Trạng thái', render: r => <Badge tone={r.statusTone}>{r.status}</Badge> },
        ]}
        rows={[
          { code: 'IT4409', name: 'Lập trình Web', class: '21CLC02', tc: 3, teacher: 'TS. Lê Thị Bích', sched: 'T2 · 7:00 — T4 · 15:00', status: 'Đã ghi nhận', statusTone: 'success' },
          { code: 'IT4063', name: 'Trí tuệ nhân tạo', class: '21CLC01', tc: 4, teacher: 'PGS. Nguyễn Tuấn', sched: 'T2 · 13:00', status: 'Đã ghi nhận', statusTone: 'success' },
          { code: 'IT3090', name: 'Cơ sở dữ liệu', class: '21CLC03', tc: 3, teacher: 'TS. Phạm Hoa', sched: 'T4 · 9:00', status: 'Trùng lịch', statusTone: 'danger' },
          { code: 'IT3070', name: 'Hệ điều hành', class: '21CLC02', tc: 3, teacher: 'ThS. Đỗ Long', sched: 'T5 · 7:00', status: 'Đã ghi nhận', statusTone: 'success' },
          { code: 'IT4593', name: 'Kiểm thử phần mềm', class: '21CLC02', tc: 2, teacher: 'ThS. Vũ Hà', sched: 'T6 · 13:00', status: 'Chờ duyệt', statusTone: 'warn' },
          { code: 'EN3270', name: 'Anh văn chuyên ngành', class: 'EN02', tc: 3, teacher: 'Ms. Williams', sched: 'T7 · 7:00', status: 'Đã ghi nhận', statusTone: 'success' },
        ]}
      />
    </Card>
  </>
);

// ─── ĐĂNG KÝ THỦ CÔNG ──────────────────────────────────────────────────────
const StudentRegister = () => (
  <>
    <PageTitle
      subtitle="Chọn môn → chọn lớp học phần → xác nhận. Hệ thống kiểm tra trùng lịch, tiên quyết và tín chỉ."
      action={<>
        <Button variant="secondary" icon="sparkle">Chuyển sang Tự động</Button>
        <Button variant="primary" icon="check">Xác nhận đăng ký (3)</Button>
      </>}>
      Đăng ký môn học · thủ công
    </PageTitle>

    <div style={{
      display: 'flex', gap: 10, padding: '12px 14px',
      borderRadius: 10, background: 'var(--accentSoft)', border: '1px solid var(--accent)',
      marginBottom: 16, alignItems: 'center',
    }}>
      <Icon name="clock" size={16} style={{ color: 'var(--accent)' }} />
      <div style={{ flex: 1, fontSize: 13 }}>
        <strong style={{ color: 'var(--accent)' }}>Đợt đăng ký đang mở</strong>
        <span style={{ color: 'var(--textMuted)' }}> · 12/05 → 23/05/2026 · còn 4 ngày 06:24:11 — tối đa 24 tín chỉ · tối thiểu 12 tín chỉ</span>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
      <div style={{ display: 'grid', gap: 14 }}>
        <Card title="Danh sách môn học có thể đăng ký" subtitle="Kỳ 2 · 2025–2026" pad={0}
          action={<div style={{ display: 'flex', gap: 8 }}>
            <Button size="sm" variant="ghost" icon="filter">Lọc</Button>
            <Input value="Tìm môn..." prefix={<Icon name="search" size={13} />} style={{ width: 220 }} />
          </div>}>
          <Tabs items={[
            { id: 'avail', label: 'Có thể đăng ký', count: 14 },
            { id: 'req', label: 'Bắt buộc', count: 5 },
            { id: 'elec', label: 'Tự chọn', count: 9 },
            { id: 'retry', label: 'Học lại', count: 1 },
          ]} active="avail" style={{ padding: '0 14px', margin: 0 }} />
          <Table
            columns={[
              { key: 'code', label: 'Mã', mono: true },
              { key: 'name', label: 'Tên môn học', wrap: true,
                render: r => <div>
                  <div style={{ fontWeight: 500 }}>{r.name}</div>
                  {r.pre && <div style={{ fontSize: 11, color: 'var(--textFaint)', marginTop: 2 }}>Tiên quyết: {r.pre}</div>}
                </div> },
              { key: 'tc', label: 'TC', align: 'center' },
              { key: 'type', label: 'Loại', render: r => <Badge tone={r.type === 'BB' ? 'accent' : 'neutral'}>{r.type === 'BB' ? 'Bắt buộc' : 'Tự chọn'}</Badge> },
              { key: 'sections', label: 'Lớp HP', align: 'center', render: r => <span style={{ color: 'var(--textMuted)' }}>{r.sections} lớp</span> },
              { key: 'act', label: '', align: 'right',
                render: r => r.added
                  ? <Badge tone="success">Đã thêm</Badge>
                  : <Button size="sm" variant="soft" icon="plus">Thêm</Button> },
            ]}
            rows={[
              { code: 'IT4409', name: 'Lập trình Web nâng cao', tc: 3, type: 'BB', sections: 4, pre: 'IT3100 · IT3080', added: true },
              { code: 'IT4063', name: 'Trí tuệ nhân tạo', tc: 4, type: 'BB', sections: 3, pre: 'IT3100', added: true },
              { code: 'IT3090', name: 'Cơ sở dữ liệu', tc: 3, type: 'BB', sections: 5, added: true },
              { code: 'IT3070', name: 'Hệ điều hành', tc: 3, type: 'BB', sections: 3, pre: 'IT2010' },
              { code: 'IT4593', name: 'Kiểm thử phần mềm', tc: 2, type: 'TC', sections: 2 },
              { code: 'IT4282', name: 'Phát triển ứng dụng di động', tc: 3, type: 'TC', sections: 2, pre: 'IT3100' },
              { code: 'IT4566', name: 'An toàn thông tin', tc: 3, type: 'TC', sections: 2 },
              { code: 'EN3270', name: 'Anh văn chuyên ngành', tc: 3, type: 'BB', sections: 6 },
              { code: 'IT4995', name: 'Đồ án tốt nghiệp (chuẩn bị)', tc: 2, type: 'BB', sections: 1 },
            ]}
          />
        </Card>

        <Card title="Lớp học phần — IT4409 · Lập trình Web nâng cao" subtitle="4 lớp đang mở · chọn 1" pad={0}>
          <Table
            columns={[
              { key: 'sel', label: '', render: r => <Radio checked={r.id === '21CLC02'} /> },
              { key: 'id', label: 'Lớp HP', mono: true },
              { key: 'teacher', label: 'Giáo viên', wrap: true },
              { key: 'sched', label: 'Lịch học' },
              { key: 'room', label: 'Phòng', mono: true },
              { key: 'cap', label: 'Sĩ số', render: r => <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{r.cap}</span>
                  <div style={{ width: 60, height: 5, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: r.pct + '%', height: '100%', background: r.pct > 90 ? 'var(--danger)' : r.pct > 75 ? 'var(--warn)' : 'var(--accent)' }} />
                  </div>
                </div>, align: 'right' },
              { key: 'tag', label: '', render: r => r.tag && <Badge tone={r.tagTone}>{r.tag}</Badge>, align: 'right' },
            ]}
            rows={[
              { id: '21CLC01', teacher: 'PGS. Nguyễn Tuấn', sched: 'T2 · 7:00 — T4 · 13:00', room: 'D9-302', cap: '52/60', pct: 86, tag: '', tagTone: 'neutral' },
              { id: '21CLC02', teacher: 'TS. Lê Thị Bích', sched: 'T2 · 7:00 — T4 · 15:00', room: 'D9-204', cap: '38/60', pct: 63, tag: 'Đề xuất', tagTone: 'accent' },
              { id: '21CLC03', teacher: 'ThS. Trần Quân', sched: 'T3 · 13:00 — T5 · 9:00', room: 'B1-501', cap: '58/60', pct: 96, tag: 'Sắp đầy', tagTone: 'warn' },
              { id: '21CLC04', teacher: 'TS. Lê Thị Bích', sched: 'T6 · 7:00 — T7 · 7:00', room: 'D9-204', cap: '24/60', pct: 40 },
            ]}
          />
        </Card>
      </div>

      {/* Right: cart + preview TKB */}
      <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
        <Card title="Giỏ đăng ký" subtitle="3 môn · 10 tín chỉ"
          action={<Badge tone="success">Hợp lệ</Badge>} pad={0}>
          {[
            { code: 'IT4409', name: 'Lập trình Web', sec: '21CLC02', tc: 3, ok: true },
            { code: 'IT4063', name: 'Trí tuệ nhân tạo', sec: '21CLC01', tc: 4, ok: true },
            { code: 'IT3090', name: 'Cơ sở dữ liệu', sec: '21CLC03', tc: 3, ok: true },
          ].map((c, i) => (
            <div key={c.code} style={{
              padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center',
              borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ width: 6, height: 38, background: 'var(--accent)', borderRadius: 3 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'var(--textMuted)' }}>{c.code}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--textFaint)', marginTop: 2 }}>Lớp {c.sec} · {c.tc} TC</div>
              </div>
              <button style={{ ...iconBtnStyle, color: 'var(--textFaint)' }}><Icon name="trash" size={15} /></button>
            </div>
          ))}
          <div style={{ padding: '14px 16px', background: 'var(--cardAlt)', borderTop: '1px solid var(--border)', display: 'grid', gap: 8 }}>
            <Row label="Tổng tín chỉ" value="10 / 24" />
            <Row label="Học phí dự kiến" value="6.250.000 ₫" mono />
            <Row label="Trạng thái kiểm tra" value={<Badge tone="success">Không trùng lịch</Badge>} />
          </div>
        </Card>

        <Card title="Bộ lọc nhanh" pad={16}>
          <div style={{ display: 'grid', gap: 10 }}>
            <Select label="Học kỳ" value="HK2 · 2025–2026" />
            <Select label="Ngành" value="Công nghệ Thông tin (CNTT)" />
            <Select label="Khối kiến thức" value="Tất cả" />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 6 }}>Hiển thị</div>
              <div style={{ display: 'grid', gap: 6 }}>
                <Checkbox checked label="Còn chỗ" />
                <Checkbox checked label="Phù hợp tiên quyết" />
                <Checkbox label="Đã đăng ký" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </>
);

const Row = ({ label, value, mono }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
    <span style={{ color: 'var(--textMuted)' }}>{label}</span>
    <span style={{ fontWeight: 500, fontFamily: mono ? 'IBM Plex Mono' : 'inherit' }}>{value}</span>
  </div>
);

// ─── TẠO TKB TỰ ĐỘNG ───────────────────────────────────────────────────────
const StudentAutoTKB = () => {
  const optionA = [
    { day: 0, slot: 'm1', title: 'Lập trình Web', code: 'IT4409', accent: '#1e3a5f', color: 'rgba(30,58,95,.10)', room: 'D9-204', teacher: 'TS. Bích' },
    { day: 0, slot: 'a1', title: 'TT Nhân tạo', code: 'IT4063', accent: '#0f766e', color: 'rgba(15,118,110,.10)', room: 'D9-302', teacher: 'PGS. Tuấn' },
    { day: 2, slot: 'm2', title: 'Cơ sở dữ liệu', code: 'IT3090', accent: '#7c3aed', color: 'rgba(124,58,237,.10)', room: 'B1-501', teacher: 'TS. Hoa' },
    { day: 3, slot: 'm1', title: 'Hệ điều hành', code: 'IT3070', accent: '#c2410c', color: 'rgba(194,65,12,.10)', room: 'D9-105', teacher: 'ThS. Long' },
    { day: 4, slot: 'a1', title: 'Kiểm thử PM', code: 'IT4593', accent: '#1e3a5f', color: 'rgba(30,58,95,.10)', room: 'D9-204', teacher: 'ThS. Hà' },
    { day: 5, slot: 'm1', title: 'Anh văn CN', code: 'EN3270', accent: '#475569', color: 'rgba(71,85,105,.10)', room: 'F2-201', teacher: 'Ms. W.' },
  ];
  const optionB = [
    { day: 0, slot: 'a1', title: 'TT Nhân tạo', code: 'IT4063', accent: '#0f766e', color: 'rgba(15,118,110,.10)', room: 'D9-302', teacher: 'PGS. Tuấn' },
    { day: 1, slot: 'm1', title: 'Lập trình Web', code: 'IT4409', accent: '#1e3a5f', color: 'rgba(30,58,95,.10)', room: 'D9-105', teacher: 'ThS. Quân' },
    { day: 1, slot: 'a2', title: 'Cơ sở dữ liệu', code: 'IT3090', accent: '#7c3aed', color: 'rgba(124,58,237,.10)', room: 'B1-501', teacher: 'TS. Hoa' },
    { day: 2, slot: 'm1', title: 'Hệ điều hành', code: 'IT3070', accent: '#c2410c', color: 'rgba(194,65,12,.10)', room: 'D9-105', teacher: 'ThS. Long' },
    { day: 4, slot: 'a1', title: 'Kiểm thử PM', code: 'IT4593', accent: '#1e3a5f', color: 'rgba(30,58,95,.10)', room: 'D9-204', teacher: 'ThS. Hà' },
    { day: 5, slot: 'a1', title: 'Anh văn CN', code: 'EN3270', accent: '#475569', color: 'rgba(71,85,105,.10)', room: 'F2-201', teacher: 'Mr. Tony' },
  ];
  const optionC = [
    { day: 0, slot: 'm1', title: 'Lập trình Web', code: 'IT4409', accent: '#1e3a5f', color: 'rgba(30,58,95,.10)', room: 'D9-204', teacher: 'TS. Bích' },
    { day: 0, slot: 'm2', title: 'Hệ điều hành', code: 'IT3070', accent: '#c2410c', color: 'rgba(194,65,12,.10)', room: 'D9-105', teacher: 'ThS. Long' },
    { day: 2, slot: 'a1', title: 'TT Nhân tạo', code: 'IT4063', accent: '#0f766e', color: 'rgba(15,118,110,.10)', room: 'D9-302', teacher: 'PGS. Tuấn' },
    { day: 2, slot: 'a2', title: 'Cơ sở dữ liệu', code: 'IT3090', accent: '#7c3aed', color: 'rgba(124,58,237,.10)', room: 'B1-501', teacher: 'TS. Hoa' },
    { day: 4, slot: 'm1', title: 'Kiểm thử PM', code: 'IT4593', accent: '#1e3a5f', color: 'rgba(30,58,95,.10)', room: 'D9-204', teacher: 'ThS. Hà' },
    { day: 4, slot: 'm2', title: 'Anh văn CN', code: 'EN3270', accent: '#475569', color: 'rgba(71,85,105,.10)', room: 'F2-201', teacher: 'Ms. W.' },
  ];

  const options = [
    { id: 'A', label: 'Phương án A', score: 96, events: optionA, badges: ['Nghỉ T4, T7, CN', 'Đúng GV ưu tiên 6/6', 'Sáng nhiều'], chosen: true },
    { id: 'B', label: 'Phương án B', score: 88, events: optionB, badges: ['Nghỉ T3, T5, CN', 'Đúng GV ưu tiên 4/6', 'Cân bằng sáng/chiều'], chosen: false },
    { id: 'C', label: 'Phương án C', score: 82, events: optionC, badges: ['Nghỉ T2 chiều, T6, CN', 'Đúng GV ưu tiên 5/6', 'Học dồn 3 ngày'], chosen: false },
  ];

  return (
    <>
      <PageTitle
        subtitle="Hệ thống tự động tìm tổ hợp lớp học phần phù hợp nhất với ưu tiên của bạn. So sánh các phương án và xác nhận."
        action={<>
          <Button variant="secondary" icon="filter">Tinh chỉnh ưu tiên</Button>
          <Button variant="primary" icon="check">Xác nhận phương án A</Button>
        </>}>
        Tạo thời khóa biểu tự động
      </PageTitle>

      {/* Preferences strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto',
        gap: 0, background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 4, marginBottom: 14, alignItems: 'stretch',
        boxShadow: 'var(--shadow)',
      }}>
        {[
          { label: 'Môn học', value: '6 môn · 18 TC', icon: 'book' },
          { label: 'Giáo viên ưu tiên', value: 'TS. Bích, PGS. Tuấn', icon: 'user' },
          { label: 'Ngày nghỉ ưu tiên', value: 'Thứ 4, Thứ 7, Chủ nhật', icon: 'calendar' },
          { label: 'Ca học', value: 'Sáng (ưu tiên)', icon: 'sun' },
          { label: 'Phương án tìm thấy', value: '12 phương án hợp lệ', icon: 'sparkle' },
        ].map((p, i) => (
          <div key={i} style={{
            padding: '10px 14px',
            borderRight: i < 4 ? '1px solid var(--border)' : 'none',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--accentSoft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
              <Icon name={p.icon} size={15} />
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: 'var(--textMuted)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>{p.label}</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 1 }}>{p.value}</div>
            </div>
          </div>
        ))}
        <div style={{ padding: 4, display: 'grid', placeItems: 'center' }}>
          <Button variant="ghost" icon="settings">Sửa</Button>
        </div>
      </div>

      {/* Sort row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 12.5, color: 'var(--textMuted)' }}>Sắp xếp theo:</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {['Phù hợp nhất', 'Nghỉ nhiều ngày', 'Sáng nhiều', 'Phòng tập trung'].map((t, i) => (
            <div key={t} style={{
              padding: '5px 11px', borderRadius: 999, fontSize: 12.5,
              border: '1px solid ' + (i === 0 ? 'var(--accent)' : 'var(--border)'),
              background: i === 0 ? 'var(--accentSoft)' : 'transparent',
              color: i === 0 ? 'var(--accent)' : 'var(--textMuted)',
              fontWeight: i === 0 ? 600 : 500, cursor: 'pointer',
            }}>{t}</div>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--textFaint)' }}>Hiển thị 3 / 12 phương án</span>
      </div>

      {/* 3 phương án cạnh nhau */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {options.map(o => (
          <div key={o.id} style={{
            background: 'var(--card)', borderRadius: 12,
            border: '1.5px solid ' + (o.chosen ? 'var(--accent)' : 'var(--border)'),
            boxShadow: o.chosen ? '0 0 0 4px var(--accentSoft), var(--shadow)' : 'var(--shadow)',
            overflow: 'hidden', position: 'relative',
          }}>
            {o.chosen && (
              <div style={{
                position: 'absolute', top: 12, right: 12, zIndex: 2,
                padding: '3px 9px', borderRadius: 999,
                background: 'var(--accent)', color: '#fff',
                fontSize: 11, fontWeight: 600, letterSpacing: '.02em',
              }}>ĐANG CHỌN</div>
            )}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 8,
                background: 'var(--accentSoft)', color: 'var(--accent)',
                display: 'grid', placeItems: 'center',
                fontWeight: 700, fontSize: 16, fontFamily: 'IBM Plex Mono',
              }}>{o.id}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{o.label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--textMuted)' }}>6 môn · 18 TC · không trùng lịch</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1, color: o.score >= 90 ? 'var(--success)' : o.score >= 85 ? 'var(--warn)' : 'var(--textMuted)' }}>{o.score}</div>
                <div style={{ fontSize: 10, color: 'var(--textFaint)', textTransform: 'uppercase', letterSpacing: '.05em' }}>điểm phù hợp</div>
              </div>
            </div>

            <div style={{ padding: 10 }}>
              <ScheduleGrid compact dayLabels={['T2', 'T3', 'T4', 'T5', 'T6', 'T7']} events={o.events} />
            </div>

            <div style={{ padding: '0 16px 14px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {o.badges.map((b, i) => <Badge key={i} tone={i === 0 ? 'success' : i === 1 ? 'accent' : 'neutral'}>{b}</Badge>)}
            </div>

            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--cardAlt)', display: 'flex', gap: 8 }}>
              <Button variant="ghost" size="sm" style={{ flex: 1, justifyContent: 'center' }}>Xem chi tiết</Button>
              <Button variant={o.chosen ? 'primary' : 'secondary'} size="sm" style={{ flex: 1, justifyContent: 'center' }}>
                {o.chosen ? 'Đang chọn' : 'Chọn phương án'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

// ─── XEM TKB ───────────────────────────────────────────────────────────────
const StudentSchedule = () => (
  <>
    <PageTitle
      subtitle="HK2 · 2025–2026 · Tuần 15 (12/05 – 18/05)"
      action={<>
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '7px 14px', fontSize: 13, fontWeight: 500, background: 'var(--accent)', color: '#fff' }}>Tuần</div>
          <div style={{ padding: '7px 14px', fontSize: 13, fontWeight: 500, color: 'var(--textMuted)', borderLeft: '1px solid var(--border)' }}>Học kỳ</div>
          <div style={{ padding: '7px 14px', fontSize: 13, fontWeight: 500, color: 'var(--textMuted)', borderLeft: '1px solid var(--border)' }}>Danh sách</div>
        </div>
        <Button variant="secondary" icon="download">Xuất ICS</Button>
        <Button variant="secondary" icon="upload">In PDF</Button>
      </>}>
      Thời khóa biểu
    </PageTitle>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>
      <Card title="Tuần 15 · 12 → 18 / 05 / 2026" subtitle="6 môn · 18 tín chỉ · 13 buổi học" pad={12}
        action={<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button style={iconBtnStyle}><Icon name="chevronLeft" size={16} /></button>
          <span style={{ fontSize: 12.5, color: 'var(--textMuted)', padding: '0 6px', fontFamily: 'IBM Plex Mono' }}>Tuần 15</span>
          <button style={iconBtnStyle}><Icon name="chevronRight" size={16} /></button>
        </div>}>
        <ScheduleGrid events={[
          { day: 0, slot: 'm1', title: 'Lập trình Web', code: 'IT4409', accent: '#1e3a5f', color: 'rgba(30,58,95,.10)', room: 'D9-204', teacher: 'TS. Lê Thị Bích' },
          { day: 0, slot: 'a1', title: 'Trí tuệ nhân tạo', code: 'IT4063', accent: '#0f766e', color: 'rgba(15,118,110,.10)', room: 'D9-302', teacher: 'PGS. Nguyễn Tuấn' },
          { day: 2, slot: 'm2', title: 'Cơ sở dữ liệu', code: 'IT3090', accent: '#7c3aed', color: 'rgba(124,58,237,.10)', room: 'B1-501', teacher: 'TS. Phạm Hoa' },
          { day: 2, slot: 'a2', title: 'Lập trình Web (TH)', code: 'IT4409', accent: '#1e3a5f', color: 'rgba(30,58,95,.10)', room: 'D9-204', teacher: 'TS. Lê Thị Bích' },
          { day: 3, slot: 'm1', title: 'Hệ điều hành', code: 'IT3070', accent: '#c2410c', color: 'rgba(194,65,12,.10)', room: 'D9-105', teacher: 'ThS. Đỗ Long' },
          { day: 4, slot: 'a1', title: 'Kiểm thử phần mềm', code: 'IT4593', accent: '#1e3a5f', color: 'rgba(30,58,95,.10)', room: 'D9-204', teacher: 'ThS. Vũ Hà' },
          { day: 5, slot: 'm1', title: 'Anh văn chuyên ngành', code: 'EN3270', accent: '#475569', color: 'rgba(71,85,105,.10)', room: 'F2-201', teacher: 'Ms. Williams' },
        ]} />
      </Card>

      <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
        <Card title="Buổi học hôm nay" subtitle="Thứ 2 · 12/05/2026" pad={0}>
          {[
            { time: '07:00', end: '09:30', title: 'Lập trình Web', code: 'IT4409', room: 'D9-204', live: false },
            { time: '13:00', end: '15:30', title: 'Trí tuệ nhân tạo', code: 'IT4063', room: 'D9-302', live: true },
          ].map((e, i) => (
            <div key={i} style={{ padding: '14px 16px', borderBottom: i === 0 ? '1px solid var(--border)' : 'none', position: 'relative' }}>
              {e.live && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--accent)' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{e.title}</span>
                {e.live && <Badge tone="accent">Sắp diễn ra</Badge>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--textMuted)', marginTop: 4, fontFamily: 'IBM Plex Mono' }}>{e.time} → {e.end} · {e.room}</div>
              <div style={{ fontSize: 12, color: 'var(--textFaint)', marginTop: 2 }}>{e.code}</div>
            </div>
          ))}
        </Card>

        <Card title="Chú thích màu môn học" pad={14}>
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              ['#1e3a5f', 'IT4409 — Lập trình Web'],
              ['#0f766e', 'IT4063 — Trí tuệ nhân tạo'],
              ['#7c3aed', 'IT3090 — Cơ sở dữ liệu'],
              ['#c2410c', 'IT3070 — Hệ điều hành'],
              ['#475569', 'EN3270 — Anh văn CN'],
            ].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: c }} />
                <span style={{ color: 'var(--text)' }}>{l}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </>
);

// ─── LỊCH SỬ ĐĂNG KÝ ───────────────────────────────────────────────────────
const StudentHistory = () => (
  <>
    <PageTitle
      subtitle="Toàn bộ thao tác đăng ký, hủy và thay đổi lớp học phần trong các học kỳ đã qua."
      action={<Button variant="secondary" icon="download">Xuất Excel</Button>}>
      Lịch sử đăng ký môn học
    </PageTitle>

    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
      <Select label="" value="Tất cả học kỳ" style={{ width: 200 }} />
      <Select label="" value="Tất cả trạng thái" style={{ width: 200 }} />
      <Input value="Tìm môn hoặc mã đăng ký..." prefix={<Icon name="search" size={13} />} style={{ width: 280 }} />
    </div>

    <Card pad={0}>
      <Table
        columns={[
          { key: 'date', label: 'Thời điểm', mono: true },
          { key: 'sem', label: 'Học kỳ' },
          { key: 'action', label: 'Thao tác', render: r => <Badge tone={r.tone}>{r.action}</Badge> },
          { key: 'course', label: 'Môn học', wrap: true,
            render: r => <div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: 'var(--textMuted)' }}>{r.code}</div>
              <div style={{ fontWeight: 500, marginTop: 1 }}>{r.name}</div>
            </div> },
          { key: 'sec', label: 'Lớp HP', mono: true },
          { key: 'tc', label: 'TC', align: 'center' },
          { key: 'ref', label: 'Mã giao dịch', mono: true },
        ]}
        rows={[
          { date: '12/05 · 14:22', sem: 'HK2 · 25-26', action: 'Đăng ký', tone: 'success', code: 'IT4409', name: 'Lập trình Web nâng cao', sec: '21CLC02', tc: 3, ref: 'REG-1A2F' },
          { date: '12/05 · 14:18', sem: 'HK2 · 25-26', action: 'Đăng ký', tone: 'success', code: 'IT4063', name: 'Trí tuệ nhân tạo', sec: '21CLC01', tc: 4, ref: 'REG-1A2E' },
          { date: '12/05 · 14:11', sem: 'HK2 · 25-26', action: 'Hủy', tone: 'danger', code: 'IT3070', name: 'Hệ điều hành', sec: '21CLC04', tc: 3, ref: 'REG-1A22' },
          { date: '11/05 · 09:54', sem: 'HK2 · 25-26', action: 'Đổi lớp', tone: 'warn', code: 'IT3090', name: 'Cơ sở dữ liệu', sec: '21CLC03 ← 21CLC01', tc: 3, ref: 'REG-1A1B' },
          { date: '11/05 · 09:48', sem: 'HK2 · 25-26', action: 'Đăng ký', tone: 'success', code: 'EN3270', name: 'Anh văn chuyên ngành', sec: 'EN02', tc: 3, ref: 'REG-1A0C' },
          { date: '03/01 · 16:02', sem: 'HK1 · 25-26', action: 'Hoàn tất', tone: 'neutral', code: 'IT3100', name: 'Cấu trúc dữ liệu & Giải thuật', sec: '20CLC01', tc: 4, ref: 'REG-08FF' },
          { date: '03/01 · 15:58', sem: 'HK1 · 25-26', action: 'Hoàn tất', tone: 'neutral', code: 'IT3080', name: 'Mạng máy tính', sec: '20CLC02', tc: 3, ref: 'REG-08FE' },
          { date: '02/01 · 22:11', sem: 'HK1 · 25-26', action: 'Đăng ký', tone: 'success', code: 'IT2010', name: 'Toán rời rạc', sec: '20CLC01', tc: 3, ref: 'REG-08E2' },
        ]}
      />
    </Card>
  </>
);

Object.assign(window, { StudentDashboard, StudentRegister, StudentAutoTKB, StudentSchedule, StudentHistory });
