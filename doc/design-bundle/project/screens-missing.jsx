/* eslint-disable react/prop-types */
/* Missing screens — Admin: Đăng ký, Cấu hình · Teacher: Lớp phụ trách, Thông báo
   · Student: Chương trình đào tạo, Thông báo, Hồ sơ, Xem điểm */

// ═══ ADMIN ════════════════════════════════════════════════════════════════

// Quản lý đăng ký
const AdminRegistrations = () => (
  <>
    <PageTitle
      subtitle="Giám sát đợt đăng ký · phê duyệt yêu cầu hủy / đổi lớp · điều chỉnh đăng ký thủ công"
      action={<>
        <Button variant="secondary" icon="download">Xuất danh sách</Button>
        <Button variant="primary" icon="plus">Đăng ký hộ</Button>
      </>}>
      Quản lý đăng ký
    </PageTitle>

    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto', gap: 14,
      padding: 16, background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 12, marginBottom: 14, boxShadow: 'var(--shadow)',
    }}>
      <div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
          <Badge tone="success">Đợt đăng ký đang mở</Badge>
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>HK2 · 2025–2026</span>
          <span style={{ fontSize: 12, color: 'var(--textMuted)', fontFamily: 'IBM Plex Mono' }}>07/05 → 23/05/2026</span>
        </div>
        <div style={{ marginTop: 10, height: 8, background: 'var(--surface)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: '62%', height: '100%', background: 'var(--accent)', borderRadius: 4 }} />
        </div>
        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--textMuted)' }}>
          <span>Ngày 10 / 16 · Còn 4 ngày 06:24:11</span>
          <span style={{ fontFamily: 'IBM Plex Mono' }}>11,492 / 12,840 SV (89.5%)</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button variant="ghost" icon="clock">Kéo dài hạn</Button>
        <Button variant="ghost" icon="x">Đóng đợt sớm</Button>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 14 }}>
      <Stat label="Yêu cầu chờ xử lý" value="34" hint="hủy 18 · đổi lớp 16" icon="bell" tone="accent" />
      <Stat label="Đăng ký mới hôm nay" value="842" hint="↑ 18% so với hôm qua" icon="plus" delta="+18%" />
      <Stat label="Lượt hủy hôm nay" value="56" icon="x" />
      <Stat label="SV chưa đăng ký đủ" value="24" hint="dưới 12 TC tối thiểu" icon="users" />
    </div>

    <Tabs items={[
      { id: 'pending', label: 'Chờ duyệt', count: 34 },
      { id: 'all', label: 'Tất cả đăng ký', count: 84260 },
      { id: 'flag', label: 'Cần xem xét', count: 12 },
      { id: 'done', label: 'Đã xử lý', count: 1206 },
    ]} active="pending" />

    <Card pad={0}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <Input value="Tìm MSSV, mã môn, mã yêu cầu..." prefix={<Icon name="search" size={13} />} style={{ flex: 1, maxWidth: 320 }} />
        <Select value="Tất cả loại yêu cầu" style={{ width: 180 }} />
        <Select value="Tất cả khoa" style={{ width: 160 }} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <Button size="sm" variant="ghost">Duyệt tất cả</Button>
          <Button size="sm" variant="secondary">Từ chối hàng loạt</Button>
        </div>
      </div>
      <Table
        columns={[
          { key: 'sel', label: '', render: () => <Checkbox /> },
          { key: 'ref', label: 'Mã YC', mono: true },
          { key: 'time', label: 'Thời điểm', mono: true },
          { key: 'student', label: 'Sinh viên', wrap: true,
            render: r => <div>
              <div style={{ fontWeight: 500 }}>{r.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--textFaint)', fontFamily: 'IBM Plex Mono' }}>{r.id} · {r.major}</div>
            </div> },
          { key: 'type', label: 'Loại', render: r => <Badge tone={r.typeTone}>{r.type}</Badge> },
          { key: 'course', label: 'Môn / Lớp HP', wrap: true,
            render: r => <div>
              <div style={{ fontWeight: 500 }}>{r.course}</div>
              <div style={{ fontSize: 11.5, color: 'var(--textFaint)', fontFamily: 'IBM Plex Mono' }}>{r.section}</div>
            </div> },
          { key: 'reason', label: 'Lý do', wrap: true },
          { key: 'act', label: '', align: 'right',
            render: () => <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <Button size="sm" variant="ghost">Từ chối</Button>
              <Button size="sm" variant="primary" icon="check">Duyệt</Button>
            </div> },
        ]}
        rows={[
          { ref: 'YC-2A41', time: '14:12', id: '21520078', name: 'Nguyễn Thị Bích', major: 'CNTT-KTPM', type: 'Hủy đăng ký', typeTone: 'danger', course: 'Kiểm thử phần mềm', section: 'IT4593 · 21CLC02', reason: 'Trùng lịch với ĐATN — đã đăng ký 4 môn BB' },
          { ref: 'YC-2A40', time: '14:08', id: '21520142', name: 'Phạm Văn Cường', major: 'CNTT-ATTT', type: 'Đổi lớp', typeTone: 'warn', course: 'Lập trình Web', section: 'IT4409 · 21CLC03 → 02', reason: 'Lớp gốc đầy chỗ, muốn chuyển sang lớp TS. Bích' },
          { ref: 'YC-2A3E', time: '13:54', id: '22520203', name: 'Lê Khánh Duy', major: 'CNTT-HTTT', type: 'Đăng ký muộn', typeTone: 'accent', course: 'Anh văn chuyên ngành', section: 'EN3270 · EN05', reason: 'Đi thực tập DN nên đăng ký chậm' },
          { ref: 'YC-2A3C', time: '13:40', id: '21520088', name: 'Vũ Hồng Giang', major: 'CNTT-KTPM', type: 'Đổi lớp', typeTone: 'warn', course: 'Hệ điều hành', section: 'IT3070 · 04 → 02', reason: 'Trùng lịch dạy thêm Anh văn' },
          { ref: 'YC-2A39', time: '13:18', id: '21520041', name: 'Bùi Hoàng My', major: 'CNTT-KHMT', type: 'Hủy đăng ký', typeTone: 'danger', course: 'Phát triển ứng dụng di động', section: 'IT4282 · 21CLC01', reason: 'Quá tải tín chỉ — đã ĐK 21 TC' },
          { ref: 'YC-2A36', time: '12:42', id: '20520155', name: 'Trần Tuấn Nam', major: 'CNTT-KHMT', type: 'Mở lớp mới', typeTone: 'accent', course: 'An toàn thông tin', section: 'IT4566 · đề xuất 03', reason: 'Cả 2 lớp đều đầy, có 12 SV cùng yêu cầu' },
          { ref: 'YC-2A33', time: '11:58', id: '23520455', name: 'Trịnh Anh Em', major: 'CNTT-KHMT', type: 'Đăng ký hộ', typeTone: 'neutral', course: 'Toán rời rạc', section: 'MA2010 · 23CLC01', reason: 'SV không truy cập được vì khóa OTP' },
          { ref: 'YC-2A30', time: '11:24', id: '21520017', name: 'Hoàng Anh Hào', major: 'CNTT-KTPM', type: 'Hủy đăng ký', typeTone: 'danger', course: 'Trí tuệ nhân tạo', section: 'IT4063 · 21CLC02', reason: 'Chưa qua tiên quyết IT3100' },
        ]}
      />
      <div style={{ padding: '11px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--textMuted)' }}>
        <span>8 / 34 yêu cầu chờ duyệt</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button style={iconBtnStyle}><Icon name="chevronLeft" size={15} /></button>
          {['1', '2', '3', '4', '5'].map((p, i) => (
            <div key={i} style={{ minWidth: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 6, fontSize: 12.5,
              background: i === 0 ? 'var(--accent)' : 'transparent',
              color: i === 0 ? '#fff' : 'var(--textMuted)', fontWeight: i === 0 ? 600 : 500 }}>{p}</div>
          ))}
          <button style={iconBtnStyle}><Icon name="chevronRight" size={15} /></button>
        </div>
      </div>
    </Card>
  </>
);

// Cấu hình hệ thống
const AdminSettings = () => (
  <>
    <PageTitle subtitle="Cấu hình thông số vận hành cho toàn hệ thống đăng ký môn học">
      Cấu hình hệ thống
    </PageTitle>

    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 14 }}>
      {/* Side nav */}
      <Card pad={6}>
        {[
          { ic: 'sparkle', l: 'Quy tắc đăng ký', active: true },
          { ic: 'calendar', l: 'Lịch học kỳ' },
          { ic: 'megaphone', l: 'Thông báo & email' },
          { ic: 'users', l: 'Phân quyền' },
          { ic: 'lock', l: 'Bảo mật & SSO' },
          { ic: 'doc', l: 'Mẫu văn bản' },
          { ic: 'settings', l: 'Tích hợp & API' },
          { ic: 'clock', l: 'Sao lưu & nhật ký' },
        ].map((t, i) => (
          <div key={i} style={{
            padding: '9px 12px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 9,
            background: t.active ? 'var(--accentSoft)' : 'transparent',
            color: t.active ? 'var(--accent)' : 'var(--text)',
            fontWeight: t.active ? 600 : 500, fontSize: 13, cursor: 'pointer', marginBottom: 1,
          }}>
            <Icon name={t.ic} size={15} />
            <span>{t.l}</span>
          </div>
        ))}
      </Card>

      <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
        <Card title="Giới hạn tín chỉ" subtitle="Áp dụng cho HK2 · 2025–2026" pad={20}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            <ConfigField label="Tối thiểu / học kỳ" value="12 TC" hint="HK chính" mono />
            <ConfigField label="Tối đa / học kỳ" value="24 TC" hint="HK chính · vượt cần duyệt" mono />
            <ConfigField label="Tối đa / học kỳ hè" value="12 TC" mono />
            <ConfigField label="Tối thiểu để tốt nghiệp" value="152 TC" hint="theo CTĐT" mono />
            <ConfigField label="GPA tối thiểu vượt TC" value="3.20 / 4.0" mono />
            <ConfigField label="Số môn học lại tối đa" value="3 môn / HK" mono />
          </div>
        </Card>

        <Card title="Quy tắc đăng ký" pad={20}>
          <div style={{ display: 'grid', gap: 14 }}>
            <Toggle
              label="Kiểm tra môn tiên quyết tự động"
              sub="SV chỉ đăng ký được nếu đã đạt môn tiên quyết (≥ điểm D)"
              on />
            <Toggle
              label="Cho phép đăng ký vượt tín chỉ"
              sub="SV có GPA ≥ 3.2 được vượt tới 28 TC · cần duyệt thủ công"
              on />
            <Toggle
              label="Tự động xếp hàng chờ khi lớp đầy"
              sub="Khi lớp mở thêm chỗ, hệ thống tự đăng ký theo thứ tự chờ"
              on />
            <Toggle
              label="Cho phép SV tự hủy không cần duyệt"
              sub="Trong vòng 48h sau khi đăng ký"
              off />
            <Toggle
              label="Khóa đăng ký khi nợ học phí"
              sub="SV nợ trên 5,000,000 ₫ không thể đăng ký môn mới"
              on />
          </div>
        </Card>

        <Card title="Thông báo & nhắc hạn" pad={20}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
            <ConfigField label="Nhắc đợt đăng ký sắp mở" value="Trước 7 ngày" />
            <ConfigField label="Nhắc đợt đăng ký sắp đóng" value="Trước 3 ngày · 1 ngày · 6 giờ" />
            <ConfigField label="Kênh gửi" value="Email · Push · In-app" />
            <ConfigField label="Email gửi đi" value="noreply@dkmh.edu" mono />
          </div>
        </Card>
      </div>
    </div>
  </>
);

const ConfigField = ({ label, value, hint, mono }) => (
  <div style={{ padding: 12, background: 'var(--cardAlt)', border: '1px solid var(--border)', borderRadius: 8 }}>
    <div style={{ fontSize: 11, color: 'var(--textMuted)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4, fontFamily: mono ? 'IBM Plex Mono' : 'inherit' }}>{value}</div>
    {hint && <div style={{ fontSize: 11.5, color: 'var(--textFaint)', marginTop: 3 }}>{hint}</div>}
  </div>
);

const Toggle = ({ label, sub, on }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--textMuted)', marginTop: 2 }}>{sub}</div>
    </div>
    <div style={{
      width: 38, height: 22, borderRadius: 999,
      background: on ? 'var(--accent)' : 'var(--surface)',
      border: '1px solid ' + (on ? 'var(--accent)' : 'var(--borderStrong)'),
      position: 'relative', flex: '0 0 auto',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .15s',
      }} />
    </div>
  </div>
);

// ═══ TEACHER ══════════════════════════════════════════════════════════════

// Lớp phụ trách (detail of all classes + roster)
const TeacherClasses = () => (
  <>
    <PageTitle
      subtitle="4 lớp học phần HK2 · 158 sinh viên · TS. Lê Thị Bích · Khoa Công nghệ Thông tin"
      action={<>
        <Select value="HK2 · 2025–2026" style={{ width: 180 }} />
        <Button variant="secondary" icon="download">Xuất danh sách</Button>
      </>}>
      Lớp phụ trách
    </PageTitle>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 14 }}>
      {[
        { id: 'IT4409.02', name: 'Lập trình Web nâng cao', sched: 'T2 · 7:00 — T4 · 15:00', room: 'D9-204', sv: 38, max: 60, grade: 'Đang nhập', gradeTone: 'accent', focused: true },
        { id: 'IT4409.04', name: 'Lập trình Web nâng cao', sched: 'T6 · 7:00 — T7 · 7:00', room: 'D9-204', sv: 24, max: 60, grade: 'Chưa nhập', gradeTone: 'warn', focused: false },
        { id: 'IT4593.01', name: 'Kiểm thử phần mềm', sched: 'T6 · 13:00', room: 'D9-204', sv: 32, max: 40, grade: 'Đang nhập', gradeTone: 'accent', focused: false },
        { id: 'IT4995.01', name: 'Đồ án TN (chuẩn bị)', sched: 'T5 · 13:00', room: 'D9-302', sv: 12, max: 15, grade: 'Chưa đến hạn', gradeTone: 'neutral', focused: false },
      ].map(c => (
        <div key={c.id} style={{
          background: 'var(--card)', borderRadius: 12,
          border: '1.5px solid ' + (c.focused ? 'var(--accent)' : 'var(--border)'),
          boxShadow: c.focused ? '0 0 0 4px var(--accentSoft), var(--shadow)' : 'var(--shadow)',
          padding: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, fontWeight: 600 }}>{c.id}</span>
                <Badge tone={c.gradeTone}>{c.grade}</Badge>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: 'var(--textMuted)', marginTop: 6, display: 'flex', gap: 14 }}>
                <span><Icon name="calendar" size={12} /> {c.sched}</span>
                <span><Icon name="pin" size={12} /> {c.room}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'IBM Plex Mono' }}>{c.sv}<span style={{ color: 'var(--textFaint)', fontSize: 14 }}> / {c.max}</span></div>
              <div style={{ fontSize: 10.5, color: 'var(--textFaint)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>sinh viên</div>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
            <Button size="sm" variant="secondary" icon="users" style={{ flex: 1, justifyContent: 'center' }}>Danh sách SV</Button>
            <Button size="sm" variant="secondary" icon="edit" style={{ flex: 1, justifyContent: 'center' }}>Nhập điểm</Button>
            <Button size="sm" variant="ghost" icon="doc">Tài liệu</Button>
          </div>
        </div>
      ))}
    </div>

    <Card title="Danh sách sinh viên · IT4409 · 21CLC02" subtitle="38 sinh viên · 32 đã có điểm quá trình"
      action={<>
        <Input value="Tìm SV..." prefix={<Icon name="search" size={13} />} style={{ width: 200 }} />
        <Button size="sm" variant="ghost" icon="megaphone">Gửi thông báo lớp</Button>
      </>}
      pad={0}>
      <Table
        columns={[
          { key: 'stt', label: 'STT', align: 'center', mono: true },
          { key: 'id', label: 'MSSV', mono: true },
          { key: 'name', label: 'Họ và tên', wrap: true,
            render: r => <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: r.color, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600 }}>{r.ini}</div>
              <div>
                <div style={{ fontWeight: 500 }}>{r.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--textFaint)' }}>{r.email}</div>
              </div>
            </div> },
          { key: 'major', label: 'Ngành' },
          { key: 'gpa', label: 'GPA tích lũy', align: 'center', mono: true,
            render: r => <span style={{ color: r.gpa >= 3.2 ? 'var(--success)' : r.gpa >= 2.5 ? 'var(--text)' : 'var(--warn)', fontWeight: 600 }}>{r.gpa.toFixed(2)}</span> },
          { key: 'att', label: 'Chuyên cần', align: 'right',
            render: r => <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{r.att}/15</span>
              <div style={{ width: 50, height: 5, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: (r.att/15*100) + '%', height: '100%', background: r.att >= 12 ? 'var(--success)' : r.att >= 9 ? 'var(--warn)' : 'var(--danger)' }} />
              </div>
            </div> },
          { key: 'state', label: 'Trạng thái', render: r => <Badge tone={r.tone}>{r.state}</Badge> },
          { key: 'act', label: '', align: 'right', render: () => <button style={iconBtnStyle}><Icon name="more" size={16} /></button> },
        ]}
        rows={[
          { stt: 1, id: '21520001', ini: 'TA', color: '#1e3a5f', name: 'Trần Minh Anh', email: 'anh.tm21@dkmh.edu', major: 'CNTT-KHMT', gpa: 3.42, att: 14, state: 'Đang học', tone: 'success' },
          { stt: 2, id: '21520003', ini: 'NB', color: '#0f766e', name: 'Nguyễn Thị Bích', email: 'bich.nt21@dkmh.edu', major: 'CNTT-KTPM', gpa: 3.18, att: 13, state: 'Đang học', tone: 'success' },
          { stt: 3, id: '21520007', ini: 'PC', color: '#7c3aed', name: 'Phạm Văn Cường', email: 'cuong.pv21@dkmh.edu', major: 'CNTT-ATTT', gpa: 2.85, att: 12, state: 'Đang học', tone: 'success' },
          { stt: 4, id: '21520011', ini: 'LD', color: '#c2410c', name: 'Lê Khánh Duy', email: 'duy.lk21@dkmh.edu', major: 'CNTT-KHMT', gpa: 3.78, att: 15, state: 'Xuất sắc', tone: 'accent' },
          { stt: 5, id: '21520017', ini: 'TE', color: '#475569', name: 'Trịnh Hoàng Em', email: 'em.th21@dkmh.edu', major: 'CNTT-HTTT', gpa: 2.42, att: 8, state: 'Cảnh báo', tone: 'warn' },
          { stt: 6, id: '21520022', ini: 'VG', color: '#1e3a5f', name: 'Vũ Thanh Giang', email: 'giang.vt21@dkmh.edu', major: 'CNTT-KTPM', gpa: 3.24, att: 14, state: 'Đang học', tone: 'success' },
          { stt: 7, id: '21520028', ini: 'HH', color: '#0f766e', name: 'Hoàng Anh Hào', email: 'hao.ha21@dkmh.edu', major: 'CNTT-KHMT', gpa: 1.92, att: 6, state: 'Cảnh báo', tone: 'danger' },
          { stt: 8, id: '21520032', ini: 'DK', color: '#7c3aed', name: 'Đỗ Minh Khoa', email: 'khoa.dm21@dkmh.edu', major: 'CNTT-KTPM', gpa: 3.62, att: 15, state: 'Xuất sắc', tone: 'accent' },
        ]}
      />
    </Card>
  </>
);

// Teacher / Student notifications (shared inbox component)
const Notifications = ({ role }) => {
  const items = role === 'teacher' ? [
    { tone: 'accent', ic: 'megaphone', t: 'Lịch họp khoa CNTT', s: 'Phòng đào tạo · 12/05 · 10:24', body: 'Họp khoa tuần này dời sang Thứ 5 lúc 14:00 tại phòng A1-501.', unread: true },
    { tone: 'warn', ic: 'edit', t: 'Hạn nộp bảng điểm IT4409.04', s: 'Hệ thống · 12/05 · 09:00', body: 'Bạn còn 49 ngày để hoàn tất nhập điểm cho lớp IT4409.04.', unread: true },
    { tone: 'success', ic: 'check', t: 'Đề xuất đổi lịch dạy đã duyệt', s: 'Phòng đào tạo · 11/05 · 16:42', body: 'Lớp IT4409.02 chuyển sang phòng D9-301 từ tuần 16.', unread: false },
    { tone: 'neutral', ic: 'users', t: '3 SV nhập lớp mới', s: 'Phòng đào tạo · 11/05 · 14:18', body: 'IT4409.04 vừa nhận thêm 3 sinh viên chuyển từ lớp 03.', unread: false },
    { tone: 'neutral', ic: 'doc', t: 'Yêu cầu rà soát đề thi cuối kỳ', s: 'Bộ môn KTPM · 10/05', body: 'Vui lòng nộp đề thi và đáp án IT4409 trước ngày 20/06.', unread: false },
  ] : [
    { tone: 'danger', ic: 'clock', t: 'Đợt đăng ký đóng trong 4 ngày', s: 'Phòng đào tạo · 12/05 · 09:00', body: 'Hạn chót đăng ký HK2 là 23/05/2026 — 23:59. Vui lòng hoàn tất.', unread: true },
    { tone: 'accent', ic: 'sparkle', t: '3 phương án TKB phù hợp đã tạo', s: 'Hệ thống · 12/05 · 08:42', body: 'Dựa trên ưu tiên của bạn, có 3 phương án TKB tốt nhất. Mở "Tạo TKB tự động".', unread: true },
    { tone: 'success', ic: 'check', t: 'Đăng ký IT4409 thành công', s: 'Hệ thống · 12/05 · 14:22', body: 'Bạn đã đăng ký thành công lớp 21CLC02 — TS. Lê Thị Bích.', unread: false },
    { tone: 'warn', ic: 'x', t: 'Trùng lịch IT3090 & IT3070', s: 'Hệ thống · 11/05 · 22:11', body: 'Cả 2 lớp có lịch học Thứ 4 · Sáng 2. Vui lòng chọn lại lớp khác.', unread: false },
    { tone: 'neutral', ic: 'megaphone', t: 'Lịch nghỉ lễ 30/04 — 01/05', s: 'Phòng đào tạo · 28/04', body: 'Nghỉ lễ từ 30/04 đến hết 01/05. Lịch học bù sẽ thông báo sau.', unread: false },
    { tone: 'accent', ic: 'pin', t: 'Đổi phòng IT4063', s: 'Phòng đào tạo · 25/04', body: 'IT4063 chuyển sang phòng D9-302 từ tuần 14.', unread: false },
  ];

  return (
    <>
      <PageTitle
        subtitle="Thông báo cá nhân, từ hệ thống và phòng đào tạo"
        action={<>
          <Button variant="ghost" icon="check">Đánh dấu đã đọc tất cả</Button>
          <Button variant="secondary" icon="settings">Cài đặt</Button>
        </>}>
        Thông báo
      </PageTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 14 }}>
        <Card pad={6}>
          {[
            { ic: 'bell', l: 'Tất cả', count: items.length, active: true },
            { ic: 'x', l: 'Chưa đọc', count: items.filter(i => i.unread).length },
            { ic: 'megaphone', l: 'Phòng đào tạo' },
            { ic: 'sparkle', l: 'Hệ thống' },
            { ic: 'user', l: 'Cá nhân' },
          ].map((t, i) => (
            <div key={i} style={{
              padding: '9px 12px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 9,
              background: t.active ? 'var(--accentSoft)' : 'transparent',
              color: t.active ? 'var(--accent)' : 'var(--text)',
              fontWeight: t.active ? 600 : 500, fontSize: 13, marginBottom: 1, cursor: 'pointer',
            }}>
              <Icon name={t.ic} size={15} />
              <span style={{ flex: 1 }}>{t.l}</span>
              {t.count != null && <span style={{ fontSize: 11, fontFamily: 'IBM Plex Mono', color: t.active ? 'var(--accent)' : 'var(--textFaint)' }}>{t.count}</span>}
            </div>
          ))}
        </Card>

        <Card pad={0}>
          {items.map((n, i) => (
            <div key={i} style={{
              padding: '14px 18px', display: 'flex', gap: 12,
              borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
              background: n.unread ? 'var(--accentSoft)' : 'transparent',
              borderLeft: '3px solid ' + (n.unread ? 'var(--accent)' : 'transparent'),
              cursor: 'pointer',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, flex: '0 0 auto',
                background: n.tone === 'accent' ? 'var(--card)' : n.tone === 'warn' ? 'rgba(217,119,6,.13)' : n.tone === 'success' ? 'rgba(22,163,74,.12)' : n.tone === 'danger' ? 'rgba(220,38,38,.12)' : 'var(--surface)',
                color: n.tone === 'accent' ? 'var(--accent)' : n.tone === 'warn' ? 'var(--warn)' : n.tone === 'success' ? 'var(--success)' : n.tone === 'danger' ? 'var(--danger)' : 'var(--textMuted)',
                display: 'grid', placeItems: 'center',
                border: n.tone === 'accent' ? '1px solid var(--accent)' : 'none',
              }}><Icon name={n.ic} size={16} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: n.unread ? 600 : 500 }}>{n.t}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--textFaint)', flex: '0 0 auto' }}>{n.s.split('·').pop().trim()}</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--textMuted)', marginTop: 4, lineHeight: 1.55 }}>{n.body}</div>
                <div style={{ fontSize: 11, color: 'var(--textFaint)', marginTop: 6 }}>{n.s.split('·').slice(0, -1).join('·').trim()}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
};

// ═══ STUDENT ══════════════════════════════════════════════════════════════

// Chương trình đào tạo (SV view — tiến độ theo môn)
const StudentCurriculum = () => (
  <>
    <PageTitle
      subtitle="CNTT — KHMT · K21 · Chất lượng cao · 152 tín chỉ · Đã hoàn thành 103 TC (68%)"
      action={<>
        <Button variant="secondary" icon="download">Tải bản PDF</Button>
        <Button variant="primary" icon="sparkle">Đề xuất môn HK sau</Button>
      </>}>
      Chương trình đào tạo của tôi
    </PageTitle>

    <div style={{
      padding: 20, background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 12, marginBottom: 14, boxShadow: 'var(--shadow)',
      display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'center',
    }}>
      <div>
        <svg width="180" height="180" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface)" strokeWidth="10" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--accent)" strokeWidth="10"
            strokeDasharray={`${0.68 * 264} 264`} transform="rotate(-90 50 50)" strokeLinecap="round" />
          <text x="50" y="48" fontSize="20" fontWeight="600" textAnchor="middle" fill="var(--text)" fontFamily="IBM Plex Sans">68%</text>
          <text x="50" y="62" fontSize="6.5" textAnchor="middle" fill="var(--textMuted)">103 / 152 TC</text>
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--textMuted)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>Tiến độ tổng</div>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 2 }}>Năm 3 · Học kỳ 2 · 2025–2026</div>
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
          {[
            ['Đã hoàn thành', '103 TC', 'success'],
            ['Đang học', '18 TC', 'accent'],
            ['Còn phải học', '31 TC', 'neutral'],
            ['Tự chọn cần', '8 / 16 TC', 'warn'],
            ['GPA tích lũy', '3.42', 'success'],
          ].map(([l, v, t]) => (
            <div key={l}>
              <div style={{ fontSize: 11, color: 'var(--textFaint)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>{l}</div>
              <div style={{ fontSize: 19, fontWeight: 600, marginTop: 3, color: t === 'success' ? 'var(--success)' : t === 'accent' ? 'var(--accent)' : t === 'warn' ? 'var(--warn)' : 'var(--text)', fontFamily: 'IBM Plex Mono' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <Card title="Khối kiến thức" subtitle="Tiến độ theo 5 khối · 152 TC" pad={20}>
      <div style={{ display: 'grid', gap: 14 }}>
        {[
          { name: 'Đại cương', tot: 42, done: 36, color: '#1e3a5f' },
          { name: 'Cơ sở ngành', tot: 36, done: 30, color: '#0f766e' },
          { name: 'Chuyên ngành', tot: 48, done: 27, color: '#7c3aed' },
          { name: 'Tự chọn', tot: 16, done: 8, color: '#c2410c' },
          { name: 'Tốt nghiệp', tot: 10, done: 2, color: '#475569' },
        ].map(b => {
          const pct = (b.done / b.tot * 100).toFixed(0);
          return (
            <div key={b.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: b.color }} />
                  {b.name}
                </span>
                <span style={{ color: 'var(--textMuted)', fontFamily: 'IBM Plex Mono' }}>{b.done} / {b.tot} TC · {pct}%</span>
              </div>
              <div style={{ height: 9, background: 'var(--surface)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: pct + '%', height: '100%', background: b.color, borderRadius: 5 }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>

    <Card title="Lộ trình môn học" subtitle="Theo từng học kỳ — đã học · đang học · sắp tới" style={{ marginTop: 14 }} pad={0}>
      <Tabs items={[
        { id: 'y1', label: 'Năm 1', count: 14 },
        { id: 'y2', label: 'Năm 2', count: 16 },
        { id: 'y3', label: 'Năm 3 · hiện tại', count: 16 },
        { id: 'y4', label: 'Năm 4', count: 12 },
      ]} active="y3" style={{ padding: '0 14px', margin: 0 }} />
      <Table
        columns={[
          { key: 'hk', label: 'HK', mono: true, align: 'center' },
          { key: 'code', label: 'Mã môn', mono: true },
          { key: 'name', label: 'Tên môn học', wrap: true },
          { key: 'block', label: 'Khối', render: r => <Badge tone={r.blockTone}>{r.block}</Badge> },
          { key: 'tc', label: 'TC', align: 'center', mono: true },
          { key: 'grade', label: 'Điểm', align: 'center',
            render: r => r.grade != null
              ? <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 600, color: r.grade >= 8 ? 'var(--success)' : r.grade >= 5 ? 'var(--text)' : 'var(--danger)' }}>{r.grade.toFixed(1)}</span>
              : <span style={{ color: 'var(--textFaint)' }}>—</span> },
          { key: 'state', label: 'Trạng thái', render: r => <Badge tone={r.tone}>{r.state}</Badge> },
        ]}
        rows={[
          { hk: 'HK1', code: 'IT3070', name: 'Hệ điều hành', block: 'Cơ sở', blockTone: 'accent', tc: 3, grade: 8.5, state: 'Đã hoàn thành', tone: 'success' },
          { hk: 'HK1', code: 'IT3080', name: 'Mạng máy tính', block: 'Cơ sở', blockTone: 'accent', tc: 3, grade: 8.0, state: 'Đã hoàn thành', tone: 'success' },
          { hk: 'HK1', code: 'IT3090', name: 'Cơ sở dữ liệu', block: 'Cơ sở', blockTone: 'accent', tc: 3, grade: 7.5, state: 'Đã hoàn thành', tone: 'success' },
          { hk: 'HK1', code: 'IT4063', name: 'Trí tuệ nhân tạo', block: 'Chuyên ngành', blockTone: 'success', tc: 4, grade: 8.2, state: 'Đã hoàn thành', tone: 'success' },
          { hk: 'HK1', code: 'IT4995', name: 'Đồ án cơ sở', block: 'Tốt nghiệp', blockTone: 'warn', tc: 2, grade: 9.0, state: 'Đã hoàn thành', tone: 'success' },
          { hk: 'HK1', code: 'EN3270', name: 'Anh văn chuyên ngành 1', block: 'Đại cương', blockTone: 'neutral', tc: 3, grade: 7.0, state: 'Đã hoàn thành', tone: 'success' },
          { hk: 'HK2', code: 'IT4409', name: 'Lập trình Web nâng cao', block: 'Chuyên ngành', blockTone: 'success', tc: 3, grade: null, state: 'Đang học', tone: 'accent' },
          { hk: 'HK2', code: 'IT4063B', name: 'Trí tuệ nhân tạo (TC)', block: 'Tự chọn', blockTone: 'warn', tc: 4, grade: null, state: 'Đang học', tone: 'accent' },
          { hk: 'HK2', code: 'IT3070B', name: 'Hệ điều hành (LT)', block: 'Cơ sở', blockTone: 'accent', tc: 3, grade: null, state: 'Đang học', tone: 'accent' },
          { hk: 'HK2', code: 'IT4593', name: 'Kiểm thử phần mềm', block: 'Tự chọn', blockTone: 'warn', tc: 2, grade: null, state: 'Đang học', tone: 'accent' },
          { hk: 'HK2', code: 'EN3270', name: 'Anh văn chuyên ngành 2', block: 'Đại cương', blockTone: 'neutral', tc: 3, grade: null, state: 'Đang học', tone: 'accent' },
          { hk: 'HK2', code: 'IT4790', name: 'Điện toán đám mây', block: 'Chuyên ngành', blockTone: 'success', tc: 3, grade: null, state: 'Đề xuất HK sau', tone: 'neutral' },
        ]}
      />
    </Card>
  </>
);

// Xem điểm (Bảng điểm sinh viên)
const StudentGrades = () => (
  <>
    <PageTitle
      subtitle="Bảng điểm chính thức theo từng học kỳ · cập nhật cuối: 15/01/2026"
      action={<>
        <Button variant="secondary" icon="download">Tải bảng điểm chính thức</Button>
        <Button variant="primary" icon="doc">Yêu cầu xác nhận</Button>
      </>}>
      Xem điểm
    </PageTitle>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 14 }}>
      <Stat label="GPA tích lũy" value="3.42" hint="thang 4.0 · Loại Giỏi" icon="graduation" tone="accent" delta="+0.18" />
      <Stat label="TC tích lũy" value="103" hint="68% chương trình" icon="layers" />
      <Stat label="GPA học kỳ này" value="3.62" hint="HK1 · 25-26" icon="chart" delta="+0.20" />
      <Stat label="Xếp loại" value="Giỏi" hint="3.20 ≤ GPA < 3.60" icon="check" />
      <Stat label="Môn dưới TB" value="0" hint="không có nợ môn" icon="x" />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 14 }}>
      <Card title="Bảng điểm chi tiết" subtitle="Theo từng học kỳ · 12 môn HK1 · 25-26"
        action={<Select value="HK1 · 2025–2026" style={{ width: 180 }} />}
        pad={0}>
        <Table
          columns={[
            { key: 'code', label: 'Mã môn', mono: true },
            { key: 'name', label: 'Tên môn học', wrap: true },
            { key: 'tc', label: 'TC', align: 'center', mono: true },
            { key: 'qt', label: 'QT', align: 'center', mono: true,
              render: r => <span style={{ color: 'var(--textMuted)' }}>{r.qt.toFixed(1)}</span> },
            { key: 'gk', label: 'GK', align: 'center', mono: true,
              render: r => <span style={{ color: 'var(--textMuted)' }}>{r.gk.toFixed(1)}</span> },
            { key: 'ck', label: 'CK', align: 'center', mono: true,
              render: r => <span style={{ color: 'var(--textMuted)' }}>{r.ck.toFixed(1)}</span> },
            { key: 'total', label: 'Tổng', align: 'center',
              render: r => {
                const t = r.qt * 0.2 + r.gk * 0.3 + r.ck * 0.5;
                return <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, color: t >= 8 ? 'var(--success)' : t >= 5 ? 'var(--text)' : 'var(--danger)' }}>{t.toFixed(1)}</span>;
              } },
            { key: 'letter', label: 'Xếp', align: 'center',
              render: r => {
                const t = r.qt * 0.2 + r.gk * 0.3 + r.ck * 0.5;
                const [g, tone] = t >= 8.5 ? ['A', 'success'] : t >= 7 ? ['B', 'accent'] : t >= 5.5 ? ['C', 'warn'] : ['D', 'danger'];
                return <Badge tone={tone}>{g}</Badge>;
              } },
            { key: 'gpa', label: 'GPA', align: 'center', mono: true,
              render: r => {
                const t = r.qt * 0.2 + r.gk * 0.3 + r.ck * 0.5;
                const g = t >= 8.5 ? 4 : t >= 8 ? 3.5 : t >= 7 ? 3 : t >= 6.5 ? 2.5 : t >= 5.5 ? 2 : 1;
                return <span style={{ fontWeight: 600 }}>{g.toFixed(1)}</span>;
              } },
          ]}
          rows={[
            { code: 'IT3070', name: 'Hệ điều hành', tc: 3, qt: 9.0, gk: 8.5, ck: 8.5 },
            { code: 'IT3080', name: 'Mạng máy tính', tc: 3, qt: 8.5, gk: 8.0, ck: 7.8 },
            { code: 'IT3090', name: 'Cơ sở dữ liệu', tc: 3, qt: 8.0, gk: 7.5, ck: 7.3 },
            { code: 'IT4063', name: 'Trí tuệ nhân tạo', tc: 4, qt: 8.5, gk: 8.0, ck: 8.2 },
            { code: 'IT4995', name: 'Đồ án cơ sở', tc: 2, qt: 9.0, gk: 9.0, ck: 9.0 },
            { code: 'EN3270', name: 'Anh văn chuyên ngành 1', tc: 3, qt: 7.5, gk: 7.0, ck: 6.8 },
            { code: 'IT4566', name: 'An toàn thông tin (TC)', tc: 3, qt: 8.0, gk: 7.5, ck: 8.5 },
            { code: 'PE2030', name: 'Giáo dục thể chất 4', tc: 1, qt: 9.0, gk: 8.5, ck: 8.5 },
          ]}
        />
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', background: 'var(--cardAlt)', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: 'var(--textMuted)' }}>Tổng kết học kỳ</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <span>22 TC · <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 600 }}>GPA 3.62</span></span>
            <Badge tone="success">Xếp loại: Giỏi</Badge>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
        <Card title="Biểu đồ GPA theo học kỳ" pad={16}>
          <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: 10, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
            {[
              { hk: 'HK1\nN1', gpa: 3.15 },
              { hk: 'HK2\nN1', gpa: 3.28 },
              { hk: 'HK1\nN2', gpa: 3.42 },
              { hk: 'HK2\nN2', gpa: 3.36 },
              { hk: 'HK1\nN3', gpa: 3.62 },
            ].map((s, i, arr) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                <div style={{ fontSize: 10.5, fontFamily: 'IBM Plex Mono', fontWeight: 600, marginBottom: 4 }}>{s.gpa.toFixed(2)}</div>
                <div style={{
                  width: '70%', height: ((s.gpa - 2) / 2 * 140) + 'px',
                  background: i === arr.length - 1 ? 'var(--accent)' : 'var(--accentSoft)',
                  border: '1px solid var(--accent)',
                  borderRadius: '6px 6px 0 0',
                }} />
                <div style={{ fontSize: 10, color: 'var(--textMuted)', marginTop: 6, textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.2 }}>{s.hk}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quy đổi điểm" pad={14}>
          <div style={{ display: 'grid', gap: 6, fontSize: 12.5 }}>
            {[
              ['A · ≥ 8.5', '4.0', 'Giỏi', 'success'],
              ['B+ · 8.0 – 8.4', '3.5', 'Khá giỏi', 'accent'],
              ['B · 7.0 – 7.9', '3.0', 'Khá', 'accent'],
              ['C+ · 6.5 – 6.9', '2.5', 'TB khá', 'neutral'],
              ['C · 5.5 – 6.4', '2.0', 'Trung bình', 'neutral'],
              ['D · 4.0 – 5.4', '1.0', 'Đạt', 'warn'],
              ['F · < 4.0', '0.0', 'Trượt', 'danger'],
            ].map(([r, g, l, t]) => (
              <div key={r} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center', padding: '4px 0' }}>
                <span style={{ fontFamily: 'IBM Plex Mono' }}>{r}</span>
                <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 600 }}>{g}</span>
                <Badge tone={t}>{l}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </>
);

// Hồ sơ cá nhân
const StudentProfile = () => (
  <>
    <PageTitle subtitle="Thông tin cá nhân, học vụ và liên hệ"
      action={<Button variant="primary" icon="edit">Chỉnh sửa thông tin</Button>}>
      Hồ sơ cá nhân
    </PageTitle>

    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 14 }}>
      <Card pad={20}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2a4d7f 100%)',
            color: '#fff', display: 'inline-grid', placeItems: 'center',
            fontSize: 42, fontWeight: 600, fontFamily: 'IBM Plex Sans',
            boxShadow: '0 8px 24px rgba(30,58,95,.25)',
          }}>TA</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 14 }}>Trần Minh Anh</div>
          <div style={{ fontSize: 13, color: 'var(--textMuted)', fontFamily: 'IBM Plex Mono', marginTop: 2 }}>21520001</div>
          <Badge tone="success" style={{ marginTop: 8 }}>Đang học · Năm 3</Badge>
        </div>

        <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'grid', gap: 12 }}>
          {[
            ['Ngành', 'CNTT — KHMT'],
            ['Chương trình', 'Chất lượng cao'],
            ['Khóa', 'K21 · 2021–2025'],
            ['Lớp sinh hoạt', 'CNTT-KHMT-K21-CLC'],
            ['Cố vấn học tập', 'TS. Lê Thị Bích'],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
              <span style={{ color: 'var(--textMuted)' }}>{l}</span>
              <span style={{ fontWeight: 500, textAlign: 'right' }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, padding: 12, background: 'var(--cardAlt)', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--textMuted)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>GPA tích lũy</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 600, fontFamily: 'IBM Plex Mono', color: 'var(--accent)' }}>3.42</span>
            <span style={{ fontSize: 12, color: 'var(--textMuted)' }}>/ 4.0</span>
            <Badge tone="accent" style={{ marginLeft: 'auto' }}>Giỏi</Badge>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
        <Card title="Thông tin cá nhân" pad={20}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
            <Field label="Họ và tên" value="Trần Minh Anh" />
            <Field label="Ngày sinh" value="14 / 08 / 2003" />
            <Field label="Giới tính" value="Nữ" />
            <Field label="CCCD / CMND" value="079 203 001 482" mono />
            <Field label="Nơi sinh" value="TP. Hồ Chí Minh" />
            <Field label="Dân tộc · Tôn giáo" value="Kinh · Không" />
          </div>
        </Card>

        <Card title="Liên hệ" pad={20}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
            <Field label="Email cá nhân" value="anh.tm21@dkmh.edu" mono />
            <Field label="Email phụ" value="minhanh.tran@gmail.com" mono />
            <Field label="Số điện thoại" value="+84 90 123 4567" mono />
            <Field label="Liên hệ khẩn cấp" value="+84 90 888 1111 (Mẹ)" mono />
            <Field label="Địa chỉ thường trú" value="123 Nguyễn Văn Cừ, Q. 5, TP.HCM" full />
            <Field label="Địa chỉ tạm trú" value="KTX khu A, ĐHQG TP.HCM, Linh Trung, Thủ Đức" full />
          </div>
        </Card>

        <Card title="Bảo mật" pad={20}>
          <div style={{ display: 'grid', gap: 12 }}>
            <SecurityRow ic="lock" l="Mật khẩu đăng nhập" v="Đã đổi 24/03/2026" action="Đổi mật khẩu" />
            <SecurityRow ic="check" l="Xác thực 2 lớp (2FA)" v="Đã bật · qua ứng dụng Authenticator" action="Quản lý" />
            <SecurityRow ic="user" l="Phiên đăng nhập" v="3 thiết bị đang hoạt động" action="Xem & đăng xuất" />
          </div>
        </Card>
      </div>
    </div>
  </>
);

const Field = ({ label, value, mono, full }) => (
  <div style={{ gridColumn: full ? 'span 2' : 'auto' }}>
    <div style={{ fontSize: 11, color: 'var(--textMuted)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 13.5, fontWeight: 500, marginTop: 4, fontFamily: mono ? 'IBM Plex Mono' : 'inherit' }}>{value}</div>
  </div>
);

const SecurityRow = ({ ic, l, v, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
    <div style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--accentSoft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
      <Icon name={ic} size={15} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{l}</div>
      <div style={{ fontSize: 12, color: 'var(--textMuted)', marginTop: 1 }}>{v}</div>
    </div>
    <Button size="sm" variant="ghost">{action}</Button>
  </div>
);

Object.assign(window, {
  AdminRegistrations, AdminSettings,
  TeacherClasses, Notifications,
  StudentCurriculum, StudentGrades, StudentProfile,
});
