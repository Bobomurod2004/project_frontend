import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { hisobotAPI, qatoriAPI } from '../api'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  Save,
  Sheet,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Badge, LoadingBlock } from '../components/ui'

const OY = ['', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']

// ──────────────────────────────────────────────────────────────────────────────
// Super-group structure (3-level: super-group → sub-group → column)
// Groups with `subgroups` array have a second header row for sub-groups.
// ──────────────────────────────────────────────────────────────────────────────
const SUPER_GROUPS = [
  {
    label: 'Yil boshiga qoldiq',
    tone: 'slate',
    columns: [
      { key: 'yil_boshi_hajmi',    label: 'Hajmi' },
      { key: 'yil_boshi_absolyut', label: 'Abs. spirt' },
    ],
  },
  {
    label: 'Qabul / Sarflangan',
    tone: 'blue',
    columns: [
      { key: 'qabul_hajmi',    label: 'Qabul',      flag: 'qabul_mavjud' },
      { key: 'sarflangan_hajmi', label: 'Sarflangan', flag: 'sarflangan_mavjud' },
    ],
  },
  {
    label: 'Ishlab chiqarish',
    tone: 'teal',
    columns: [
      { key: 'ishlab_hajmi',    label: 'Hajmi',     flag: 'ishlab_chiqarish_mavjud' },
      { key: 'ishlab_absolyut', label: 'Abs. spirt', flag: 'ishlab_chiqarish_mavjud' },
    ],
  },
  {
    label: 'Realizatsiya',
    tone: 'emerald',
    subgroups: [
      {
        label: 'Jami',
        tone: 'emerald',
        columns: [
          { key: 'realizatsiya_hajmi',    label: 'Hajmi',     flag: 'realizatsiya_mavjud' },
          { key: 'realizatsiya_absolyut', label: 'Abs. spirt', flag: 'realizatsiya_mavjud' },
          { key: 'realizatsiya_summasi',  label: 'Summasi',   flag: 'realizatsiya_mavjud', isSumma: true },
        ],
      },
      {
        label: 'Shundan, eksport',
        tone: 'violet',
        columns: [
          { key: 'eksport_hajmi',    label: 'Hajmi',     flag: 'eksport_mavjud' },
          { key: 'eksport_absolyut', label: 'Abs. spirt', flag: 'eksport_mavjud' },
          { key: 'eksport_summasi',  label: 'Summasi',   flag: 'eksport_mavjud', isSumma: true },
        ],
      },
    ],
  },
  {
    label: "Yo'qotish / Ehtiyoj",
    tone: 'amber',
    columns: [
      { key: 'yoqotish_hajmi',  label: "Yo'qotish" },
      { key: 'oz_ehtiyoj_hajmi', label: "O'z ehtiyoji" },
    ],
  },
  {
    label: 'Oy oxiriga qoldiq',
    tone: 'red',
    columns: [
      { key: 'oy_oxiri_hajmi',    label: 'Hajmi',    computed: true },
      { key: 'oy_oxiri_absolyut', label: 'Abs. spirt', computed: true },
    ],
  },
]

// Flatten all leaf columns from a super-group
function getGroupColumns(group) {
  if (group.subgroups) return group.subgroups.flatMap((sg) => sg.columns)
  return group.columns || []
}

// All leaf columns in display order (with their display tone)
const ALL_COLS = SUPER_GROUPS.flatMap((g) => {
  if (g.subgroups) {
    return g.subgroups.flatMap((sg) => sg.columns.map((col) => ({ ...col, tone: sg.tone })))
  }
  return (g.columns || []).map((col) => ({ ...col, tone: g.tone }))
})

// ──────────────────────────────────────────────────────────────────────────────
// Frontend real-time calculation — mirrors backend _hisobla_oy_oxiri()
// mavjud=false fields are excluded from the formula even if a value is entered
// ──────────────────────────────────────────────────────────────────────────────
function hisoblaOyOxiri(qator, editedRow = {}) {
  const meta = qator.mahsulot_meta || {}

  const s = (field, mavjud = true) => {
    if (!mavjud) return 0
    const v = field in editedRow ? editedRow[field] : qator[field]
    return parseFloat(v) || 0
  }

  return {
    oy_oxiri_hajmi: (
      s('yil_boshi_hajmi')
      + s('qabul_hajmi',       meta.qabul_mavjud)
      + s('ishlab_hajmi',      meta.ishlab_chiqarish_mavjud)
      - s('sarflangan_hajmi',  meta.sarflangan_mavjud)
      - s('realizatsiya_hajmi', meta.realizatsiya_mavjud)
      - s('yoqotish_hajmi')
      - s('oz_ehtiyoj_hajmi')
    ),
    oy_oxiri_absolyut: (
      s('yil_boshi_absolyut')
      + s('ishlab_absolyut',      meta.ishlab_chiqarish_mavjud)
      - s('realizatsiya_absolyut', meta.realizatsiya_mavjud)
    ),
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Layout constants
// ──────────────────────────────────────────────────────────────────────────────
const COL_W      = 112
const INDEX_W    = 54
const PRODUCT_W  = 260

// Och-yashil rasmiy forma ohanglari — barcha guruhlar bir xil
const HDR_SUPER = { bg: '#b9c79b', border: '#9bad77' }
const HDR_SUB   = { bg: '#cdd9b4', border: '#9bad77' }
const HDR_TEXT  = '#2f3a1a'

const TONE_SUPER = {
  slate: HDR_SUPER, blue: HDR_SUPER, teal: HDR_SUPER, emerald: HDR_SUPER,
  violet: HDR_SUPER, amber: HDR_SUPER, red: HDR_SUPER,
}

const TONE_SUB = {
  emerald: HDR_SUB, violet: HDR_SUB,
}

const TONE_COL = {
  slate: '', blue: '', teal: '', emerald: '', violet: '', amber: '', red: '',
}

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────
export default function HisobotDetail() {
  const { id } = useParams()
  const [hisobot, setHisobot] = useState(null)
  const [qatorlar, setQatorlar] = useState([])
  const [edited, setEdited] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cellErrors, setCellErrors] = useState({})

  useEffect(() => {
    let active = true
    Promise.all([hisobotAPI.get(id), qatoriAPI.list(id)])
      .then(([hRes, qRes]) => {
        if (!active) return
        setHisobot(hRes.data)
        setQatorlar(qRes.data.results || [])
      })
      .catch(() => {
        if (active) setError("Hisobot ma'lumotlarini yuklashda xato yuz berdi")
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  const handleChange = (qatorId, field, value) => {
    const numVal = value === '' ? null : value

    setEdited((prev) => ({
      ...prev,
      [qatorId]: { ...(prev[qatorId] || {}), [field]: numVal },
    }))

    const EKSPORT_FIELDS = new Set([
      'eksport_hajmi', 'eksport_absolyut', 'eksport_summasi',
      'realizatsiya_hajmi', 'realizatsiya_absolyut', 'realizatsiya_summasi',
    ])

    if (EKSPORT_FIELDS.has(field)) {
      const qator = qatorlar.find((q) => q.id === qatorId)
      if (!qator) return

      setCellErrors((prev) => {
        const rowEdit = { ...(edited[qatorId] || {}), [field]: numVal }
        const get = (f) => parseFloat(f in rowEdit ? rowEdit[f] : qator[f]) || 0
        const errs = { ...(prev[qatorId] || {}) }

        // eksport_hajmi ≤ realizatsiya_hajmi
        const eHaj = get('eksport_hajmi')
        const rHaj = get('realizatsiya_hajmi')
        if (eHaj > rHaj && rHaj > 0) {
          errs.eksport_hajmi = `Eksport hajmi (${eHaj}) realizatsiyadan (${rHaj}) oshib ketdi`
        } else {
          delete errs.eksport_hajmi
        }

        // eksport_absolyut ≤ realizatsiya_absolyut
        const eAbs = get('eksport_absolyut')
        const rAbs = get('realizatsiya_absolyut')
        if (eAbs > rAbs && rAbs > 0) {
          errs.eksport_absolyut = `Eksport abs. spirt (${eAbs}) realizatsiyadan (${rAbs}) oshib ketdi`
        } else {
          delete errs.eksport_absolyut
        }

        // eksport_summasi ≤ realizatsiya_summasi
        const eSum = get('eksport_summasi')
        const rSum = get('realizatsiya_summasi')
        if (eSum > rSum && rSum > 0) {
          errs.eksport_summasi = `Eksport summasi (${eSum}) realizatsiyadan (${rSum}) oshib ketdi`
        } else {
          delete errs.eksport_summasi
        }

        return { ...prev, [qatorId]: errs }
      })
    }
  }

  const getValue = (qator, field) => {
    const rowEdit = edited[qator.id]
    if (rowEdit && field in rowEdit) return rowEdit[field] === null ? '' : rowEdit[field]
    const v = qator[field]
    return v === null || v === undefined ? '' : v
  }

  const handleSave = async () => {
    const ids = Object.keys(edited)
    if (!ids.length) { toast("O'zgarish yo'q"); return }

    const hasErrors = Object.values(cellErrors).some((row) => Object.keys(row).length > 0)
    if (hasErrors) {
      toast.error("Xatoliklarni tuzating, so'ng saqlang")
      return
    }

    setSaving(true)
    try {
      const updates = ids
        .map((qatorId) => {
          const qator = qatorlar.find((item) => item.id === Number(qatorId))
          if (!qator) return null
          return qatoriAPI.patch(Number(qatorId), {
            ...edited[qatorId],
            hisobot: qator.hisobot,
            mahsulot: qator.mahsulot,
          })
        })
        .filter(Boolean)

      await Promise.all(updates)
      const response = await qatoriAPI.list(id)
      setQatorlar(response.data.results || [])
      setEdited({})
      setCellErrors({})
      toast.success(`${ids.length} ta qator muvaffaqiyatli saqlandi`)
    } catch (err) {
      const d = err.response?.data
      if (d && typeof d === 'object') {
        toast.error(Object.values(d).flat().join(' | '))
      } else {
        toast.error('Saqlashda xato yuz berdi')
      }
    } finally {
      setSaving(false)
    }
  }

  const changedRows   = Object.keys(edited).length
  const changedFields = Object.values(edited).reduce((s, r) => s + Object.keys(r).length, 0)
  const hasChanges    = changedRows > 0
  const errorCount    = Object.values(cellErrors).reduce((s, r) => s + Object.keys(r).length, 0)
  const totalWidth    = INDEX_W + PRODUCT_W + ALL_COLS.length * COL_W + 16

  if (loading) return <div className="report-grid-shell"><LoadingBlock /></div>

  if (error) return (
    <div className="page-shell">
      <div className="alert-banner"><AlertCircle size={16} />{error}</div>
    </div>
  )

  if (!hisobot) return (
    <div className="page-shell">
      <div className="alert-banner"><AlertCircle size={16} />Hisobot topilmadi</div>
    </div>
  )

  // ── sticky header cell shared styles ──
  const stickyBase = {
    position: 'sticky',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRight: '1px solid rgba(255,255,255,0.15)',
    color: HDR_TEXT,
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: 0.3,
  }

  return (
    <div className="report-grid-shell">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <header className="sheet-toolbar">
        <div className="sheet-title">
          <Link to="/hisobotlar" className="icon-btn" aria-label="Hisobotlar ro'yxatiga qaytish">
            <ArrowLeft size={17} />
          </Link>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge tone="blue">{OY[hisobot.oy]} {hisobot.yil}</Badge>
              <Badge tone={hasChanges ? 'amber' : 'emerald'}>
                {hasChanges ? 'Saqlanmagan' : 'Saqlangan'}
              </Badge>
            </div>
            <h1>{hisobot.korxona_nomi}</h1>
            <p>Oylik mahsulot harakati va realizatsiya ko'rsatkichlari</p>
          </div>
        </div>

        <div className="sheet-actions">
          {hasChanges && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || errorCount > 0}
              className={`btn ${errorCount > 0 ? 'btn-danger' : 'btn-success'}`}
              title={errorCount > 0 ? 'Avval xatoliklarni tuzating' : ''}
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saqlanmoqda...' : errorCount > 0 ? `${errorCount} xatolik bor` : 'Saqlash'}
            </button>
          )}
          <a href={hisobotAPI.pdfUrl(id)} download className="btn btn-danger">
            <FileText size={14} /> PDF
          </a>
          <a href={hisobotAPI.excelUrl(id)} download className="btn btn-secondary">
            <Sheet size={14} /> Excel
          </a>
        </div>
      </header>

      {/* ── Change / Error bar ──────────────────────────────────────────── */}
      {errorCount > 0 && (
        <div className="sheet-changebar" style={{ background: '#fff1f2', color: '#be123c', borderColor: '#fecaca' }}>
          ⚠ {errorCount} ta katakda xatolik bor — eksport qiymati realizatsiyadan oshib ketdi.
        </div>
      )}
      {hasChanges && errorCount === 0 && (
        <div className="sheet-changebar">
          {changedRows} ta qator, {changedFields} ta katakda saqlanmagan o'zgarish bor.
        </div>
      )}

      {/* ── Table area ──────────────────────────────────────────────────── */}
      <main className="sheet-area">
        <section className="sheet-frame">
          <div style={{ minWidth: totalWidth }}>

            {/* ══ ROW 1: Super-group labels ══════════════════════════════ */}
            <div style={{ display: 'flex', height: 32 }}>
              {/* sticky: index + product */}
              <div style={{ ...stickyBase, width: INDEX_W, left: 0, background: HDR_SUPER.bg }} />
              <div style={{ ...stickyBase, width: PRODUCT_W, left: INDEX_W, background: HDR_SUPER.bg, justifyContent: 'flex-start', paddingLeft: 12 }}>
                Mahsulot
              </div>
              {/* super-group cells */}
              {SUPER_GROUPS.map((group) => {
                const cols = getGroupColumns(group)
                const t = TONE_SUPER[group.tone]
                return (
                  <div
                    key={group.label}
                    style={{
                      width: cols.length * COL_W,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: t.bg,
                      borderRight: `1px solid ${t.border}`,
                      borderBottom: group.subgroups ? `1px solid ${t.border}` : 'none',
                      color: HDR_TEXT,
                      fontWeight: 700,
                      fontSize: 11,
                      letterSpacing: 0.3,
                    }}
                  >
                    {group.label}
                  </div>
                )
              })}
              <div style={{ width: 16, flexShrink: 0, background: HDR_SUPER.bg }} />
            </div>

            {/* ══ ROW 2: Sub-group labels ═════════════════════════════════ */}
            <div style={{ display: 'flex', height: 24 }}>
              <div style={{ ...stickyBase, width: INDEX_W, left: 0, background: HDR_SUB.bg, fontSize: 10 }} />
              <div style={{ ...stickyBase, width: PRODUCT_W, left: INDEX_W, background: HDR_SUB.bg, justifyContent: 'flex-start', paddingLeft: 12, fontSize: 10 }}>
                Mahsulot turi
              </div>
              {SUPER_GROUPS.map((group) => {
                const t = TONE_SUPER[group.tone]
                if (group.subgroups) {
                  return group.subgroups.map((sg) => {
                    const st = TONE_SUB[sg.tone] || t
                    return (
                      <div
                        key={sg.label}
                        style={{
                          width: sg.columns.length * COL_W,
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: st.bg,
                          borderRight: `1px solid ${st.border}`,
                          color: HDR_TEXT,
                          fontWeight: 700,
                          fontSize: 10,
                          letterSpacing: 0.2,
                        }}
                      >
                        {sg.label}
                      </div>
                    )
                  })
                }
                // Filler — same bg as super-group row (visual merge effect)
                const cols = getGroupColumns(group)
                return (
                  <div
                    key={group.label}
                    style={{
                      width: cols.length * COL_W,
                      flexShrink: 0,
                      background: t.bg,
                      borderRight: `1px solid ${t.border}`,
                    }}
                  />
                )
              })}
              <div style={{ width: 16, flexShrink: 0, background: HDR_SUB.bg }} />
            </div>

            {/* ══ ROW 3: Column labels ════════════════════════════════════ */}
            <div className="sheet-column-row">
              <div className="sheet-sticky-column-head justify-center" style={{ width: INDEX_W, left: 0 }}>
                <span>T/p</span>
              </div>
              <div className="sheet-sticky-column-head" style={{ width: PRODUCT_W, left: INDEX_W }}>
                <span>Mahsulot turi</span>
              </div>
              {ALL_COLS.map((column) => (
                <div
                  key={column.key}
                  className={`sheet-column-head ${TONE_COL[column.tone]}`}
                  style={{ width: COL_W }}
                >
                  <span>{column.label}</span>
                </div>
              ))}
              <div className="w-4 shrink-0 bg-white" />
            </div>

            {/* ══ Data rows ═══════════════════════════════════════════════ */}
            {qatorlar.length === 0 ? (
              <div className="state-block"><span>Hisobot qatorlari topilmadi</span></div>
            ) : (
              qatorlar.map((qator, index) => {
                const meta = qator.mahsulot_meta || {}
                const rowEdited = !!edited[qator.id]
                const rowBg = rowEdited ? '#fffbeb' : index % 2 === 0 ? '#ffffff' : '#f8fafc'

                return (
                  <div key={qator.id} className="sheet-row">
                    <div className="sheet-index" style={{ width: INDEX_W, left: 0, background: rowBg }}>
                      <span className={`text-[12px] font-black ${rowEdited ? 'text-amber-700' : 'text-slate-400'}`}>
                        {qator.mahsulot_tartib}
                      </span>
                    </div>
                    <div className="sheet-product" style={{ width: PRODUCT_W, left: INDEX_W, background: rowBg }}>
                      <span>{qator.mahsulot_nomi}</span>
                    </div>

                    {ALL_COLS.map((column) => {
                      const isLocked   = column.flag && !meta[column.flag]
                      const changed    = !!edited[qator.id] && column.key in edited[qator.id]
                      const cellErr    = cellErrors[qator.id]?.[column.key]

                      if (column.computed) {
                        const computed    = hisoblaOyOxiri(qator, edited[qator.id] || {})
                        const computedVal = computed[column.key]
                        const display     = computedVal === 0 ? '0.000' : computedVal.toFixed(3)
                        const isNeg       = computedVal < 0
                        return (
                          <div
                            key={column.key}
                            className="sheet-cell"
                            title="Avtomatik hisoblanadi"
                            style={{
                              width: COL_W,
                              background: isNeg ? '#fff1f2' : '#f0fdf4',
                              justifyContent: 'flex-end',
                              paddingRight: 10,
                              cursor: 'default',
                              userSelect: 'none',
                            }}
                          >
                            <span style={{
                              fontSize: 11, fontWeight: 700,
                              color: isNeg ? '#be123c' : '#15803d',
                            }}>
                              {display}
                            </span>
                          </div>
                        )
                      }

                      // "x" belgilangan ustun — bu mahsulot uchun to'ldirilmaydi, qabul qilinmaydi
                      if (isLocked) {
                        return (
                          <div
                            key={column.key}
                            className="sheet-cell"
                            title="Bu mahsulot uchun to'ldirilmaydi"
                            style={{
                              width: COL_W,
                              background: '#f1f5f9',
                              justifyContent: 'center',
                              cursor: 'not-allowed',
                              userSelect: 'none',
                            }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1' }}>×</span>
                          </div>
                        )
                      }

                      const value = getValue(qator, column.key)
                      return (
                        <div
                          key={column.key}
                          className={`sheet-cell ${changed ? 'changed' : ''}`}
                          style={{
                            width: COL_W,
                            background: cellErr ? '#fff1f2' : rowBg,
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            padding: 0,
                            position: 'relative',
                          }}
                          title={cellErr || ''}
                        >
                          <input
                            type="number"
                            inputMode="decimal"
                            step={column.isSumma ? '0.01' : '0.001'}
                            min="0"
                            value={value}
                            onChange={(e) => handleChange(qator.id, column.key, e.target.value)}
                            aria-label={`${qator.mahsulot_nomi} - ${column.label}`}
                            placeholder="0"
                            style={{
                              width: '100%',
                              height: '100%',
                              minHeight: 38,
                              padding: '0 8px',
                              textAlign: 'right',
                              fontSize: 11,
                              fontWeight: changed ? 700 : 400,
                              background: 'transparent',
                              border: 'none',
                              outline: 'none',
                              color: cellErr ? '#be123c' : changed ? '#92400e' : '#1a2540',
                            }}
                          />
                          {cellErr && (
                            <div style={{
                              position: 'absolute', bottom: 0, left: 0, right: 0,
                              height: 2, background: '#ef4444', borderRadius: 1,
                            }} />
                          )}
                        </div>
                      )
                    })}
                    <div className="w-4 shrink-0" style={{ background: rowBg }} />
                  </div>
                )
              })
            )}
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="sheet-footer">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <span><strong>Hajm:</strong> dal (dekalitr)</span>
          <span><strong>Pul:</strong> so'm</span>
          <span style={{ color: '#15803d' }}><strong>Yashil:</strong> oy oxiri avtomatik hisoblanadi</span>
        </div>
        {hasChanges ? (
          <span className="font-black text-amber-700">Saqlash kutilmoqda</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-black text-emerald-700">
            <CheckCircle2 size={13} /> Saqlangan
          </span>
        )}
      </footer>
    </div>
  )
}
