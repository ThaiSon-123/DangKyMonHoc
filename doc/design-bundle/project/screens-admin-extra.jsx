/* eslint-disable react/prop-types */
/* Additional admin screens: Ngành đào tạo + Chương trình đào tạo (CTĐT). */

// ─── NGÀNH ĐÀO TẠO ────────────────────────────────────────────────────────
const AdminMajors = () => (
  <>
    <PageTitle
      subtitle="Danh mục ngành, chuyên ngành đào tạo và bậc đào tạo trên toàn trường"
      action={<>
        <Button variant="secondary" icon="upload">Nhập từ Excel</Button>
        <Button variant="primary" icon="plus">Thêm ngành</Button>
      </>}>
      Ngành đào tạo
    </PageTitle>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 14 }}>
      <Stat label="Ngành đào tạo" value="14" hint="5 khoa · 3 viện" icon="graduation" tone="accent" />
      <Stat label="Chuyên ngành" value="32" hint="thuộc 14 ngành" icon="layers" />
      <Stat label="CTĐT đang áp dụng" value="48" hint="K20 → K23" icon="clipboard" />
      <Stat label="Sinh viên theo học" value="12,840" hint="toàn trường" icon="users" />
    </div>

    <Card pad={0}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <Input value="Tìm ngành, mã ngành..." prefix={<Icon name="search" size={13} />} style={{ flex: 1, maxWidth: 320 }} />
        <Select value="Tất cả khoa / viện" style={{ width: 200 }} />
        <Select value="Tất cả bậc đào tạo" style={{ width: 180 }} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <Button size="sm" variant="ghost" icon="filter">Lọc</Button>
        </div>
      </div>
      <Table
        columns={[
          { key: 'code', label: 'Mã ngành', mono: true },
          { key: 'name', label: 'Tên ngành', wrap: true,
            render: r => <div>
              <div style={{ fontWeight: 600 }}>{r.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--textFaint)', marginTop: 1 }}>{r.en}</div>
            </div> },
          { key: 'fac', label: 'Khoa / Viện', wrap: true },
          { key: 'level', label: 'Bậc', render: r => <Badge tone={r.level === 'Đại học' ? 'accent' : 'neutral'}>{r.level}</Badge> },
          { key: 'specs', label: 'Chuyên ngành', align: 'center', mono: true },
          { key: 'tc', label: 'Tín chỉ TN', align: 'center', mono: true },
          { key: 'sv', label: 'Sinh viên', align: 'right',
            render: r => <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 500 }}>{r.sv.toLocaleString()}</span> },
          { key: 'state', label: 'Trạng thái', render: r => <Badge tone={r.stateTone}>{r.state}</Badge> },
          { key: 'act', label: '', align: 'right',
            render: () => <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
              <button style={iconBtnStyle}><Icon name="edit" size={15} /></button>
              <button style={iconBtnStyle}><Icon name="more" size={16} /></button>
            </div> },
        ]}
        rows={[
          { code: '7480201', name: 'Công nghệ Thông tin', en: 'Information Technology', fac: 'Khoa Công nghệ Thông tin', level: 'Đại học', specs: 4, tc: 152, sv: 3245, state: 'Hoạt động', stateTone: 'success' },
          { code: '7480103', name: 'Kỹ thuật Phần mềm', en: 'Software Engineering', fac: 'Khoa Công nghệ Thông tin', level: 'Đại học', specs: 3, tc: 152, sv: 2876, state: 'Hoạt động', stateTone: 'success' },
          { code: '7480104', name: 'Hệ thống Thông tin', en: 'Information Systems', fac: 'Khoa Công nghệ Thông tin', level: 'Đại học', specs: 2, tc: 150, sv: 1842, state: 'Hoạt động', stateTone: 'success' },
          { code: '7480101', name: 'Khoa học Máy tính', en: 'Computer Science', fac: 'Khoa Công nghệ Thông tin', level: 'Đại học', specs: 3, tc: 154, sv: 2104, state: 'Hoạt động', stateTone: 'success' },
          { code: '7480202', name: 'An toàn Thông tin', en: 'Information Security', fac: 'Khoa Công nghệ Thông tin', level: 'Đại học', specs: 2, tc: 152, sv: 1425, state: 'Hoạt động', stateTone: 'success' },
          { code: '7480206', name: 'Mạng máy tính & TTDL', en: 'Computer Networks & Data Comm.', fac: 'Khoa Công nghệ Thông tin', level: 'Đại học', specs: 2, tc: 150, sv: 842, state: 'Hoạt động', stateTone: 'success' },
          { code: '7510302', name: 'Kỹ thuật Máy tính', en: 'Computer Engineering', fac: 'Khoa Điện tử — Viễn thông', level: 'Đại học', specs: 2, tc: 156, sv: 506, state: 'Hoạt động', stateTone: 'success' },
          { code: '8480201', name: 'Công nghệ Thông tin', en: 'Information Technology', fac: 'Khoa Công nghệ Thông tin', level: 'Cao học', specs: 3, tc: 60, sv: 124, state: 'Hoạt động', stateTone: 'success' },
          { code: '7340101', name: 'Quản trị Kinh doanh', en: 'Business Administration', fac: 'Khoa Kinh tế', level: 'Đại học', specs: 4, tc: 128, sv: 1208, state: 'Tạm dừng tuyển', stateTone: 'warn' },
        ]}
      />
    </Card>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
      <Card title="Khoa CNTT · Cấu trúc chuyên ngành" subtitle="6 ngành · 16 chuyên ngành" pad={20}>
        <div style={{ display: 'grid', gap: 14 }}>
          {[
            { code: '7480201', major: 'Công nghệ Thông tin', specs: ['Hệ thống thông minh', 'Khoa học dữ liệu', 'Công nghệ phần mềm hướng dịch vụ', 'Phát triển ứng dụng'] },
            { code: '7480103', major: 'Kỹ thuật Phần mềm', specs: ['Kỹ nghệ phần mềm', 'Phát triển game & XR', 'Web & Mobile'] },
            { code: '7480202', major: 'An toàn Thông tin', specs: ['An toàn hệ thống', 'Điều tra số'] },
          ].map(m => (
            <div key={m.code} style={{ padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--cardAlt)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11.5, color: 'var(--textMuted)' }}>{m.code}</span>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{m.major}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {m.specs.map((s, i) => (
                  <span key={i} style={{
                    padding: '4px 9px', borderRadius: 6, fontSize: 11.5,
                    background: 'var(--card)', border: '1px solid var(--border)',
                    color: 'var(--text)', fontWeight: 500,
                  }}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Phân bố sinh viên theo ngành" pad={20}>
        <div style={{ display: 'grid', gap: 12 }}>
          {[
            ['CNTT', 3245, '#1e3a5f'],
            ['KTPM', 2876, '#0f766e'],
            ['KHMT', 2104, '#7c3aed'],
            ['HTTT', 1842, '#c2410c'],
            ['ATTT', 1425, '#475569'],
            ['QTKD', 1208, '#0e1c33'],
            ['Khác', 140, '#94a3b8'],
          ].map(([n, v, c]) => {
            const total = 12840;
            const pct = (v / total * 100).toFixed(1);
            return (
              <div key={n}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                  <span style={{ fontWeight: 500 }}>{n}</span>
                  <span style={{ color: 'var(--textMuted)', fontFamily: 'IBM Plex Mono' }}>{v.toLocaleString()} · {pct}%</span>
                </div>
                <div style={{ height: 7, background: 'var(--surface)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: pct + '%', height: '100%', background: c, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  </>
);

// ─── CHƯƠNG TRÌNH ĐÀO TẠO ────────────────────────────────────────────────
const AdminCurriculum = () => (
  <>
    <PageTitle
      subtitle="CNTT · Khóa K21 · Chương trình Chất lượng cao · 152 tín chỉ · Áp dụng từ HK1 · 2021–2022"
      action={<>
        <Select value="CNTT — K21 — CLC" style={{ width: 220 }} />
        <Button variant="secondary" icon="download">Xuất PDF</Button>
        <Button variant="primary" icon="edit">Chỉnh sửa CTĐT</Button>
      </>}>
      Chương trình đào tạo
    </PageTitle>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 14 }}>
      <Stat label="Tổng tín chỉ" value="152" hint="bắt buộc 118 · tự chọn 34" icon="layers" tone="accent" />
      <Stat label="Số học kỳ" value="8" hint="K21 · 4 năm" icon="calendar" />
      <Stat label="Tổng môn học" value="58" hint="44 BB · 14 TC" icon="book" />
      <Stat label="Đồ án / Thực tập" value="3" hint="ĐACS · TT · ĐATN" icon="clipboard" />
      <Stat label="Áp dụng cho" value="824 SV" hint="K21 · CLC" icon="users" />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 14 }}>
      <Card title="Cấu trúc khối kiến thức" subtitle="Tổng 152 tín chỉ · phân theo 5 khối" pad={20}>
        <div style={{ display: 'grid', gap: 14 }}>
          {[
            { label: 'Đại cương', sub: 'Toán · Lý · Triết · Ngoại ngữ', tc: 42, color: '#1e3a5f', courses: 14 },
            { label: 'Cơ sở ngành', sub: 'CTDL · OOP · Mạng · CSDL · OS', tc: 36, color: '#0f766e', courses: 12 },
            { label: 'Chuyên ngành', sub: 'AI · LT Web · Mobile · Cloud', tc: 48, color: '#7c3aed', courses: 18 },
            { label: 'Tự chọn', sub: 'Tùy chọn theo định hướng', tc: 16, color: '#c2410c', courses: 10 },
            { label: 'Tốt nghiệp', sub: 'ĐA · Thực tập · ĐATN', tc: 10, color: '#475569', courses: 4 },
          ].map(b => {
            const pct = (b.tc / 152 * 100).toFixed(1);
            return (
              <div key={b.label}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: b.color }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{b.label}</span>
                      <span style={{ color: 'var(--textMuted)', fontFamily: 'IBM Plex Mono', fontSize: 12.5 }}>{b.tc} TC · {b.courses} môn · {pct}%</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--textFaint)', marginTop: 1 }}>{b.sub}</div>
                  </div>
                </div>
                <div style={{ height: 8, background: 'var(--surface)', borderRadius: 4, overflow: 'hidden', marginLeft: 20 }}>
                  <div style={{ width: pct + '%', height: '100%', background: b.color, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Phân bổ tín chỉ theo học kỳ" subtitle="K21 · 8 học kỳ chính thức" pad={20}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 200, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          {[
            { hk: 'HK1', y: 1, tc: 17 },
            { hk: 'HK2', y: 1, tc: 19 },
            { hk: 'HK1', y: 2, tc: 20 },
            { hk: 'HK2', y: 2, tc: 22 },
            { hk: 'HK1', y: 3, tc: 21 },
            { hk: 'HK2', y: 3, tc: 18 },
            { hk: 'HK1', y: 4, tc: 18 },
            { hk: 'HK2', y: 4, tc: 17 },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fontWeight: 600, color: 'var(--text)' }}>{s.tc}</div>
              <div style={{
                width: '100%', height: (s.tc / 24 * 160) + 'px',
                background: i === 3 ? 'var(--accent)' : 'var(--accentSoft)',
                border: '1px solid ' + (i === 3 ? 'var(--accent)' : 'var(--accentSoft)'),
                borderRadius: '6px 6px 0 0',
              }} />
              <div style={{ fontSize: 10, color: 'var(--textMuted)', textAlign: 'center', lineHeight: 1.2 }}>{s.hk}<br/>N{s.y}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--accentSoft)', borderRadius: 8, fontSize: 12.5, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="sparkle" size={14} />
          <span>HK2 năm 2 đạt 22 TC — cao nhất chương trình. Trung bình 19 TC / HK.</span>
        </div>
      </Card>
    </div>

    <Card title="Danh sách môn học theo học kỳ" subtitle="58 môn · 152 TC" pad={0}>
      <Tabs items={[
        { id: 'y1', label: 'Năm 1', count: 14 },
        { id: 'y2', label: 'Năm 2', count: 16 },
        { id: 'y3', label: 'Năm 3', count: 16, active: true },
        { id: 'y4', label: 'Năm 4', count: 12 },
      ]} active="y3" style={{ padding: '0 14px', margin: 0 }} />
      <Table
        columns={[
          { key: 'hk', label: 'Học kỳ', mono: true, align: 'center' },
          { key: 'code', label: 'Mã môn', mono: true },
          { key: 'name', label: 'Tên môn học', wrap: true,
            render: r => <div>
              <div style={{ fontWeight: 500 }}>{r.name}</div>
              {r.pre && <div style={{ fontSize: 11, color: 'var(--textFaint)', marginTop: 2 }}>Tiên quyết: {r.pre}</div>}
            </div> },
          { key: 'block', label: 'Khối kiến thức', render: r => <Badge tone={r.blockTone}>{r.block}</Badge> },
          { key: 'type', label: 'Loại', render: r => <Badge tone={r.type === 'BB' ? 'accent' : 'neutral'}>{r.type === 'BB' ? 'Bắt buộc' : 'Tự chọn'}</Badge> },
          { key: 'tc', label: 'TC', align: 'center', mono: true },
          { key: 'lt', label: 'LT', align: 'center', mono: true },
          { key: 'th', label: 'TH', align: 'center', mono: true },
          { key: 'act', label: '', align: 'right',
            render: () => <button style={iconBtnStyle}><Icon name="more" size={16} /></button> },
        ]}
        rows={[
          { hk: 'HK1', code: 'IT3070', name: 'Hệ điều hành', pre: 'IT2010', block: 'Cơ sở ngành', blockTone: 'accent', type: 'BB', tc: 3, lt: 30, th: 30 },
          { hk: 'HK1', code: 'IT3080', name: 'Mạng máy tính', pre: 'IT2010', block: 'Cơ sở ngành', blockTone: 'accent', type: 'BB', tc: 3, lt: 30, th: 30 },
          { hk: 'HK1', code: 'IT3090', name: 'Cơ sở dữ liệu', pre: 'IT3100', block: 'Cơ sở ngành', blockTone: 'accent', type: 'BB', tc: 3, lt: 30, th: 30 },
          { hk: 'HK1', code: 'IT4063', name: 'Trí tuệ nhân tạo', pre: 'IT3100', block: 'Chuyên ngành', blockTone: 'success', type: 'BB', tc: 4, lt: 45, th: 30 },
          { hk: 'HK1', code: 'EN3270', name: 'Anh văn chuyên ngành 1', block: 'Đại cương', blockTone: 'neutral', type: 'BB', tc: 3, lt: 45, th: 0 },
          { hk: 'HK1', code: 'IT4995', name: 'Đồ án cơ sở', pre: 'IT3090', block: 'Tốt nghiệp', blockTone: 'warn', type: 'BB', tc: 2, lt: 0, th: 60 },
          { hk: 'HK1', code: 'IT4566', name: 'An toàn thông tin (TC)', block: 'Tự chọn', blockTone: 'warn', type: 'TC', tc: 3, lt: 30, th: 30 },
          { hk: 'HK2', code: 'IT4409', name: 'Lập trình Web nâng cao', pre: 'IT3100 · IT3080', block: 'Chuyên ngành', blockTone: 'success', type: 'BB', tc: 3, lt: 30, th: 30 },
          { hk: 'HK2', code: 'IT4593', name: 'Kiểm thử phần mềm', pre: 'IT3100', block: 'Chuyên ngành', blockTone: 'success', type: 'TC', tc: 2, lt: 30, th: 0 },
          { hk: 'HK2', code: 'IT4282', name: 'Phát triển ứng dụng di động', pre: 'IT3100', block: 'Chuyên ngành', blockTone: 'success', type: 'TC', tc: 3, lt: 30, th: 30 },
          { hk: 'HK2', code: 'IT4790', name: 'Điện toán đám mây', pre: 'IT3080', block: 'Chuyên ngành', blockTone: 'success', type: 'BB', tc: 3, lt: 30, th: 30 },
          { hk: 'HK2', code: 'PE2030', name: 'Giáo dục thể chất 4', block: 'Đại cương', blockTone: 'neutral', type: 'BB', tc: 1, lt: 0, th: 30 },
        ]}
      />
    </Card>
  </>
);

Object.assign(window, { AdminMajors, AdminCurriculum });
