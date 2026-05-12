/* eslint-disable react/prop-types */
/* Teacher screens: Dashboard, Lịch dạy cá nhân, Lớp phụ trách, Nhập điểm. */

// ─── TEACHER DASHBOARD ────────────────────────────────────────────────────
const TeacherDashboard = () => (
  <>
    <PageTitle
      subtitle="HK2 · 2025–2026 · TS. Lê Thị Bích · Khoa Công nghệ Thông tin"
      action={<>
        <Button variant="secondary" icon="download">Xuất bảng điểm</Button>
        <Button variant="primary" icon="edit">Nhập điểm</Button>
      </>}>
      Chào buổi sáng, TS. Bích
    </PageTitle>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 14 }}>
      <Stat label="Lớp đang phụ trách" value="4" hint="HK này" icon="clipboard" tone="accent" />
      <Stat label="Tổng số sinh viên" value="158" hint="trên 4 lớp" icon="users" />
      <Stat label="Buổi dạy tuần này" value="6" hint="12 giờ giảng" icon="calendar" />
      <Stat label="Bảng điểm chưa nộp" value="2" hint="hạn 30/06" icon="edit" />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 14 }}>
      <Card title="Lịch dạy hôm nay" subtitle="Thứ 2 · 12/05/2026" pad={0}>
          {[
            { time: '07:00', end: '09:30', title: 'Lập trình Web nâng cao', code: 'IT4409 · Lớp 21CLC02', room: 'D9-204', sv: 38, status: 'Sắp bắt đầu' },
            { time: '14:30', end: '17:00', title: 'Lập trình Web nâng cao', code: 'IT4409 · Lớp 21CLC04', room: 'D9-204', sv: 24, status: '' },
          ].map((e, i) => (
            <div key={i} style={{ padding: 16, borderBottom: i === 0 ? '1px solid var(--border)' : 'none', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 16, alignItems: 'center' }}>
              <div style={{
                background: 'var(--accentSoft)', borderRadius: 8, padding: '10px 14px',
                textAlign: 'center', minWidth: 92,
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent)', fontFamily: 'IBM Plex Mono' }}>{e.time}</div>
                <div style={{ fontSize: 11, color: 'var(--textMuted)' }}>→ {e.end}</div>
              </div>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{e.title}</span>
                  {e.status && <Badge tone="accent">{e.status}</Badge>}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--textMuted)', marginTop: 4, display: 'flex', gap: 14 }}>
                  <span style={{ fontFamily: 'IBM Plex Mono' }}>{e.code}</span>
                  <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Icon name="pin" size={12} /> {e.room}</span>
                  <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Icon name="users" size={12} /> {e.sv} sinh viên</span>
                </div>
              </div>
              <Button variant="secondary" size="sm" iconRight="arrowRight">Vào lớp</Button>
            </div>
          ))}
      </Card>

      <Card title="Đang cần xử lý" pad={0}>
        {[
          { ic: 'edit', tone: 'warn', t: 'Chưa nhập điểm cuối kỳ IT4409.04', s: 'Hạn 30/06 · còn 49 ngày' },
          { ic: 'megaphone', tone: 'accent', t: 'Đề xuất đổi lịch dạy được duyệt', s: 'IT4409.02 chuyển sang D9-301 từ tuần 16' },
          { ic: 'users', tone: 'neutral', t: '3 sinh viên mới nhập lớp IT4409.04', s: 'Cập nhật từ phòng đào tạo' },
          { ic: 'doc', tone: 'success', t: 'Đã nộp bảng điểm IT4409.01 (HK1)', s: '15/01/2026 · 142 SV' },
        ].map((x, i) => (
          <div key={i} style={{ padding: '12px 16px', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, flex: '0 0 auto',
              background: x.tone === 'warn' ? 'rgba(217,119,6,.13)' : x.tone === 'success' ? 'rgba(22,163,74,.12)' : x.tone === 'accent' ? 'var(--accentSoft)' : 'var(--surface)',
              color: x.tone === 'warn' ? 'var(--warn)' : x.tone === 'success' ? 'var(--success)' : x.tone === 'accent' ? 'var(--accent)' : 'var(--textMuted)',
              display: 'grid', placeItems: 'center',
            }}><Icon name={x.ic} size={14} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{x.t}</div>
              <div style={{ fontSize: 11.5, color: 'var(--textMuted)', marginTop: 1 }}>{x.s}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>

    <Card title="Lớp phụ trách HK2 · 25–26" pad={0}>
      <Table
        columns={[
          { key: 'class', label: 'Lớp HP', mono: true },
          { key: 'name', label: 'Môn học', wrap: true },
          { key: 'sched', label: 'Lịch học' },
          { key: 'room', label: 'Phòng', mono: true },
          { key: 'sv', label: 'Sĩ số', align: 'right',
            render: r => <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{r.sv}</span>
              <div style={{ width: 50, height: 5, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: r.pct + '%', height: '100%', background: 'var(--accent)' }} />
              </div>
            </div> },
          { key: 'grades', label: 'Bảng điểm', render: r => <Badge tone={r.gtone}>{r.grades}</Badge> },
          { key: 'act', label: '', align: 'right',
            render: () => <Button size="sm" variant="ghost" iconRight="chevronRight">Mở</Button> },
        ]}
        rows={[
          { class: 'IT4409.02', name: 'Lập trình Web nâng cao', sched: 'T2 · 7:00 — T4 · 15:00', room: 'D9-204', sv: '38/60', pct: 63, grades: 'Đang nhập', gtone: 'accent' },
          { class: 'IT4409.04', name: 'Lập trình Web nâng cao', sched: 'T6 · 7:00 — T7 · 7:00', room: 'D9-204', sv: '24/60', pct: 40, grades: 'Chưa nhập', gtone: 'warn' },
          { class: 'IT4593.01', name: 'Kiểm thử phần mềm', sched: 'T6 · 13:00', room: 'D9-204', sv: '32/40', pct: 80, grades: 'Đang nhập', gtone: 'accent' },
          { class: 'IT4995.01', name: 'Đồ án TN (chuẩn bị)', sched: 'T5 · 13:00', room: 'D9-302', sv: '12/15', pct: 80, grades: 'Chưa đến hạn', gtone: 'neutral' },
        ]}
      />
    </Card>
  </>
);

// ─── LỊCH DẠY CÁ NHÂN ────────────────────────────────────────────────────
const TeacherSchedule = () => (
  <>
    <PageTitle
      subtitle="HK2 · 2025–2026 · Tuần 15 (12 → 18 / 05) · 4 lớp · 12 giờ giảng / tuần"
      action={<>
        <Button variant="secondary" icon="download">Xuất ICS</Button>
        <Button variant="secondary" icon="megaphone">Đề xuất đổi lịch</Button>
      </>}>
      Lịch dạy cá nhân
    </PageTitle>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>
      <Card title="Tuần 15 · 12 → 18 / 05" subtitle="6 buổi · 4 lớp khác nhau" pad={12}
        action={<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button style={iconBtnStyle}><Icon name="chevronLeft" size={16} /></button>
          <span style={{ fontSize: 12.5, color: 'var(--textMuted)', padding: '0 6px', fontFamily: 'IBM Plex Mono' }}>Tuần 15</span>
          <button style={iconBtnStyle}><Icon name="chevronRight" size={16} /></button>
        </div>}>
        <ScheduleGrid events={[
          { day: 0, slot: 'm1', title: 'IT4409 · 21CLC02', code: 'Lập trình Web', accent: '#1e3a5f', color: 'rgba(30,58,95,.10)', room: 'D9-204', teacher: '38 SV' },
          { day: 0, slot: 'a2', title: 'IT4409 · 21CLC02', code: 'Lập trình Web (TH)', accent: '#1e3a5f', color: 'rgba(30,58,95,.10)', room: 'D9-204', teacher: '38 SV' },
          { day: 2, slot: 'a2', title: 'IT4409 · 21CLC02', code: 'Bài tập lớn', accent: '#1e3a5f', color: 'rgba(30,58,95,.10)', room: 'D9-204', teacher: '38 SV' },
          { day: 3, slot: 'a1', title: 'IT4995 · 21CLC', code: 'ĐATN chuẩn bị', accent: '#7c3aed', color: 'rgba(124,58,237,.10)', room: 'D9-302', teacher: '12 SV' },
          { day: 4, slot: 'm1', title: 'IT4409 · 21CLC04', code: 'Lập trình Web', accent: '#1e3a5f', color: 'rgba(30,58,95,.10)', room: 'D9-204', teacher: '24 SV' },
          { day: 4, slot: 'a1', title: 'IT4593 · 21CLC01', code: 'Kiểm thử PM', accent: '#c2410c', color: 'rgba(194,65,12,.10)', room: 'D9-204', teacher: '32 SV' },
          { day: 5, slot: 'm1', title: 'IT4409 · 21CLC04', code: 'Lập trình Web (TH)', accent: '#1e3a5f', color: 'rgba(30,58,95,.10)', room: 'D9-204', teacher: '24 SV' },
        ]} />
      </Card>

      <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
        <Card title="Phân bổ giờ giảng" subtitle="HK2 · 2025–2026" pad={16}>
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              ['IT4409 · LT Web', 8, 12, '#1e3a5f'],
              ['IT4593 · KTPM', 2, 12, '#c2410c'],
              ['IT4995 · ĐATN', 2, 12, '#7c3aed'],
            ].map(([n, h, t, c]) => (
              <div key={n}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span style={{ fontWeight: 500 }}>{n}</span>
                  <span style={{ color: 'var(--textMuted)', fontFamily: 'IBM Plex Mono' }}>{h}h / tuần</span>
                </div>
                <div style={{ height: 6, marginTop: 4, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: (h/t*100)+'%', height: '100%', background: c }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
            <span style={{ color: 'var(--textMuted)' }}>Tổng giờ giảng</span>
            <span style={{ fontWeight: 600, fontFamily: 'IBM Plex Mono' }}>12 / 20 chuẩn</span>
          </div>
        </Card>

        <Card title="Buổi tiếp theo" subtitle="Thứ 2 · 12/05" pad={16}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 600, fontFamily: 'IBM Plex Mono', color: 'var(--accent)' }}>07:00</span>
            <span style={{ fontSize: 12, color: 'var(--textMuted)' }}>→ 09:30</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 13.5, fontWeight: 600 }}>IT4409 · 21CLC02</div>
          <div style={{ fontSize: 12, color: 'var(--textMuted)', marginTop: 2 }}>Phòng D9-204 · 38 sinh viên</div>
          <Button variant="primary" size="sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }} iconRight="arrowRight">Mở lớp</Button>
        </Card>
      </div>
    </div>
  </>
);

// ─── NHẬP ĐIỂM ───────────────────────────────────────────────────────────
const TeacherGrades = () => (
  <>
    <PageTitle
      subtitle="IT4409 · Lập trình Web nâng cao · Lớp 21CLC02 · 38 sinh viên · TS. Lê Thị Bích"
      action={<>
        <Button variant="ghost" icon="upload">Nhập từ Excel</Button>
        <Button variant="secondary" icon="download">Xuất bảng điểm</Button>
        <Button variant="primary" icon="check">Lưu & nộp</Button>
      </>}>
      Nhập điểm
    </PageTitle>

    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto',
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
      marginBottom: 14, boxShadow: 'var(--shadow)', overflow: 'hidden',
    }}>
      {[
        { l: 'Lớp HP', v: '21CLC02', mono: true },
        { l: 'Hệ số quá trình', v: '20%' },
        { l: 'Hệ số giữa kỳ', v: '30%' },
        { l: 'Hệ số cuối kỳ', v: '50%' },
        { l: 'Đã nhập', v: '32 / 38 SV' },
      ].map((c, i) => (
        <div key={i} style={{ padding: '12px 18px', borderRight: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--textMuted)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>{c.l}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, fontFamily: c.mono ? 'IBM Plex Mono' : 'inherit' }}>{c.v}</div>
        </div>
      ))}
      <div style={{ padding: 8, display: 'grid', placeItems: 'center' }}>
        <Button variant="ghost" icon="settings" size="sm">Cấu hình</Button>
      </div>
    </div>

    <Tabs items={[
      { id: 'all', label: 'Tất cả', count: 38 },
      { id: 'in', label: 'Đã nhập đủ', count: 24 },
      { id: 'partial', label: 'Nhập một phần', count: 8 },
      { id: 'miss', label: 'Chưa nhập', count: 6 },
    ]} active="all" />

    <Card pad={0}>
      <Table
        columns={[
          { key: 'stt', label: 'STT', align: 'center', mono: true },
          { key: 'id', label: 'MSSV', mono: true },
          { key: 'name', label: 'Họ và tên', wrap: true },
          { key: 'qt', label: 'QT (20%)', align: 'center',
            render: r => <GradeCell value={r.qt} max={10} /> },
          { key: 'gk', label: 'GK (30%)', align: 'center',
            render: r => <GradeCell value={r.gk} max={10} /> },
          { key: 'ck', label: 'CK (50%)', align: 'center',
            render: r => <GradeCell value={r.ck} max={10} /> },
          { key: 'total', label: 'Tổng', align: 'center',
            render: r => {
              if (r.qt == null || r.gk == null || r.ck == null) return <span style={{ color: 'var(--textFaint)' }}>—</span>;
              const t = (r.qt * 0.2 + r.gk * 0.3 + r.ck * 0.5).toFixed(1);
              return <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{t}</span>;
            } },
          { key: 'letter', label: 'Xếp', align: 'center',
            render: r => {
              if (r.qt == null || r.gk == null || r.ck == null) return <Badge tone="neutral">—</Badge>;
              const t = r.qt * 0.2 + r.gk * 0.3 + r.ck * 0.5;
              const [g, tone] = t >= 8.5 ? ['A', 'success'] : t >= 7 ? ['B', 'accent'] : t >= 5.5 ? ['C', 'warn'] : t >= 4 ? ['D', 'warn'] : ['F', 'danger'];
              return <Badge tone={tone}>{g}</Badge>;
            } },
          { key: 'state', label: 'Trạng thái',
            render: r => {
              const filled = (r.qt != null) + (r.gk != null) + (r.ck != null);
              if (filled === 3) return <Badge tone="success">Đã nhập</Badge>;
              if (filled === 0) return <Badge tone="danger">Chưa nhập</Badge>;
              return <Badge tone="warn">{filled}/3</Badge>;
            } },
        ]}
        rows={[
          { stt: 1, id: '21520001', name: 'Trần Minh Anh', qt: 9.0, gk: 8.5, ck: 9.2 },
          { stt: 2, id: '21520003', name: 'Nguyễn Thị Bích', qt: 8.0, gk: 7.5, ck: 8.0 },
          { stt: 3, id: '21520007', name: 'Phạm Văn Cường', qt: 7.0, gk: 6.5, ck: 7.2 },
          { stt: 4, id: '21520011', name: 'Lê Khánh Duy', qt: 9.5, gk: 9.0, ck: 9.5 },
          { stt: 5, id: '21520017', name: 'Trịnh Hoàng Em', qt: 6.0, gk: 5.5, ck: null },
          { stt: 6, id: '21520022', name: 'Vũ Thanh Giang', qt: 8.5, gk: 8.0, ck: 8.5 },
          { stt: 7, id: '21520028', name: 'Hoàng Anh Hào', qt: 4.5, gk: 5.0, ck: 4.0 },
          { stt: 8, id: '21520032', name: 'Đỗ Minh Khoa', qt: 9.0, gk: null, ck: null },
          { stt: 9, id: '21520038', name: 'Lý Phương Linh', qt: 8.0, gk: 8.5, ck: 8.2 },
          { stt: 10, id: '21520041', name: 'Bùi Hoàng My', qt: null, gk: null, ck: null },
          { stt: 11, id: '21520047', name: 'Trần Tuấn Nam', qt: 7.5, gk: 7.0, ck: 7.8 },
          { stt: 12, id: '21520052', name: 'Nguyễn Bảo Ngọc', qt: 8.5, gk: 9.0, ck: 8.8 },
          { stt: 13, id: '21520058', name: 'Phạm Quốc Phú', qt: 6.5, gk: 6.0, ck: 7.0 },
          { stt: 14, id: '21520063', name: 'Lê Hồng Quân', qt: 9.0, gk: 8.5, ck: 9.0 },
        ]}
      />
    </Card>
  </>
);

const GradeCell = ({ value, max = 10 }) => {
  if (value == null) {
    return (
      <span style={{
        display: 'inline-block', minWidth: 56, padding: '5px 8px',
        borderRadius: 6, border: '1px dashed var(--borderStrong)',
        color: 'var(--textFaint)', fontSize: 12, fontFamily: 'IBM Plex Mono',
      }}>—</span>
    );
  }
  const tone = value >= 8 ? 'var(--success)' : value >= 5 ? 'var(--text)' : 'var(--danger)';
  return (
    <span style={{
      display: 'inline-block', minWidth: 56, padding: '5px 8px',
      borderRadius: 6, background: 'var(--surface)',
      color: tone, fontSize: 13, fontFamily: 'IBM Plex Mono', fontWeight: 600,
      textAlign: 'center',
    }}>{value.toFixed(1)}</span>
  );
};

Object.assign(window, { TeacherDashboard, TeacherSchedule, TeacherGrades });
