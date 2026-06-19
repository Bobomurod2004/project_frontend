import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { hisobotAPI, korxonaAPI } from '../api'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  Calendar,
  FileSpreadsheet,
  PackageCheck,
  Send,
  SlidersHorizontal,
  Store,
  Warehouse,
  X,
} from 'lucide-react'
import {
  ActionButton,
  AlertBanner,
  Badge,
  EmptyBlock,
  LoadingBlock,
  MetricCard,
  PageHeader,
  Panel,
  SelectField,
} from '../components/ui'

const OY = ['', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
const currentYear = new Date().getFullYear()
const YIL_LIST = Array.from({ length: 8 }, (_, index) => currentYear - index)

const CARD_CONFIG = [
  {
    key: 'production',
    title: 'Ishlab chiqarish',
    icon: PackageCheck,
    color: '#0f766e',
    tint: '#ecfdf5',
    mainKey: 'ishlab_hajmi',
    rows: [
      { key: 'ishlab_hajmi', label: 'Ishlab hajmi' },
      { key: 'ishlab_absolyut', label: 'Ishlab abs.' },
      { key: 'qabul_hajmi', label: 'Qabul' },
      { key: 'sarflangan_hajmi', label: 'Sarflangan' },
    ],
  },
  {
    key: 'sales',
    title: 'Realizatsiya',
    icon: Store,
    color: '#2563eb',
    tint: '#eff6ff',
    mainKey: 'realizatsiya_hajmi',
    rows: [
      { key: 'realizatsiya_hajmi', label: 'Realiz. hajmi' },
      { key: 'realizatsiya_absolyut', label: 'Realiz. abs.' },
      { key: 'realizatsiya_summasi', label: 'Realiz. summa', isSumma: true },
      { key: 'yoqotish_hajmi', label: "Yo'qotish" },
    ],
  },
  {
    key: 'export',
    title: 'Eksport',
    icon: Send,
    color: '#7c3aed',
    tint: '#f5f3ff',
    mainKey: 'eksport_hajmi',
    rows: [
      { key: 'eksport_hajmi', label: 'Eksport hajmi' },
      { key: 'eksport_absolyut', label: 'Eksport abs.' },
      { key: 'eksport_summasi', label: 'Eksport summa', isSumma: true },
      { key: 'eksport_ulushi', label: 'Realiz.dagi ulushi', isPercent: true },
    ],
  },
  {
    key: 'stock',
    title: 'Qoldiq',
    icon: Warehouse,
    color: '#b45309',
    tint: '#fffbeb',
    mainKey: 'oy_oxiri_hajmi',
    rows: [
      { key: 'yil_boshi_hajmi', label: 'Yil boshi haj.' },
      { key: 'yil_boshi_absolyut', label: 'Yil boshi abs.' },
      { key: 'oy_oxiri_hajmi', label: 'Oy oxiri haj.' },
      { key: 'oy_oxiri_absolyut', label: 'Oy oxiri abs.' },
    ],
  },
]

const COMPANY_COLS = [
  { key: 'ishlab_hajmi', label: 'Ishlab' },
  { key: 'realizatsiya_hajmi', label: 'Realiz.' },
  { key: 'eksport_hajmi', label: 'Eksport' },
  { key: 'yoqotish_hajmi', label: "Yo'qotish" },
  { key: 'oy_oxiri_hajmi', label: 'Qoldiq' },
]

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function fmt(value, isSumma) {
  if (value === null || value === undefined) return '—'
  return Number(value).toLocaleString('ru-RU', {
    minimumFractionDigits: isSumma ? 2 : 3,
    maximumFractionDigits: isSumma ? 2 : 3,
  })
}

function fmtCompact(value, isSumma) {
  if (value === null || value === undefined) return '—'
  const num = Number(value)
  if (Math.abs(num) >= 1_000_000_000) {
    return (num / 1_000_000_000).toLocaleString('ru-RU', { maximumFractionDigits: isSumma ? 1 : 2 }) + ' mlrd'
  }
  if (Math.abs(num) >= 1_000_000) {
    return (num / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: isSumma ? 1 : 2 }) + ' mln'
  }
  if (Math.abs(num) >= 1_000) {
    return (num / 1_000).toLocaleString('ru-RU', { maximumFractionDigits: isSumma ? 1 : 2 }) + ' ming'
  }
  return num.toLocaleString('ru-RU', { maximumFractionDigits: isSumma ? 1 : 2 })
}

function buildAlerts(months) {
  const alerts = []

  months.forEach((month) => {
    month.korxonalar.forEach((row) => {
      const qoldiq = toNumber(row.oy_oxiri_hajmi)
      const realiz = toNumber(row.realizatsiya_hajmi)
      const eksport = toNumber(row.eksport_hajmi)
      const yoqotish = toNumber(row.yoqotish_hajmi)

      if (qoldiq < 0) {
        alerts.push(`${row.korxona_nomi}: ${month.oy_nomi} oyida qoldiq manfiy`)
      }
      if (eksport > realiz && realiz > 0) {
        alerts.push(`${row.korxona_nomi}: eksport realizatsiyadan yuqori`)
      }
      if (realiz > 0 && yoqotish / realiz >= 0.1) {
        alerts.push(`${row.korxona_nomi}: yo'qotish ko'rsatkichi yuqori`)
      }
    })
  })

  return alerts.slice(0, 4)
}

export default function Svod() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [svod, setSvod] = useState(null)
  const [korxonalar, setKorxonalar] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const filter = {
    yil: searchParams.get('yil') || String(currentYear),
    oy: searchParams.get('oy') || '',
    korxona: searchParams.get('korxona') || '',
  }

  useEffect(() => {
    let active = true

    korxonaAPI.list({ page_size: 500 })
      .then((response) => {
        if (active) setKorxonalar(response.data.results || [])
      })
      .catch(() => {
        if (active) setError("Korxonalar ro'yxatini yuklashda xato yuz berdi")
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    const params = { yil: filter.yil }
    if (filter.oy) params.oy = filter.oy
    if (filter.korxona) params.korxona = filter.korxona

    hisobotAPI.svodlar(params)
      .then((response) => {
        if (!active) return
        setSvod(response.data)
        setError('')
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.detail || "Svod ma'lumotlarini yuklashda xato yuz berdi")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [filter.yil, filter.oy, filter.korxona])

  const analytics = useMemo(() => {
    const months = svod?.oylar || []
    const totals = {}
    const companyMap = new Map()

    months.forEach((month) => {
      Object.entries(month.jami || {}).forEach(([key, value]) => {
        totals[key] = (totals[key] || 0) + toNumber(value)
      })

      month.korxonalar.forEach((row) => {
        const current = companyMap.get(row.korxona) || {
          korxona: row.korxona,
          korxona_nomi: row.korxona_nomi,
          inn: row.inn,
          hisobot_id: row.hisobot_id,
        }

        COMPANY_COLS.forEach((column) => {
          if (column.key === 'oy_oxiri_hajmi') {
            current[column.key] = toNumber(row[column.key])
          } else {
            current[column.key] = (current[column.key] || 0) + toNumber(row[column.key])
          }
        })

        if (!current.hisobot_id && row.hisobot_id) current.hisobot_id = row.hisobot_id
        companyMap.set(row.korxona, current)
      })
    })

    const eksport = totals.eksport_hajmi || 0
    const realiz = totals.realizatsiya_hajmi || 0
    const firstMonth = months[0]?.jami || {}
    const lastMonth = months[months.length - 1]?.jami || {}
    totals.yil_boshi_hajmi = toNumber(firstMonth.yil_boshi_hajmi)
    totals.yil_boshi_absolyut = toNumber(firstMonth.yil_boshi_absolyut)
    totals.oy_oxiri_hajmi = toNumber(lastMonth.oy_oxiri_hajmi)
    totals.oy_oxiri_absolyut = toNumber(lastMonth.oy_oxiri_absolyut)
    totals.eksport_ulushi = realiz ? (eksport / realiz) * 100 : 0

    const cards = CARD_CONFIG.map((card) => ({
      ...card,
      value: totals[card.mainKey] || 0,
    }))
    const maxCard = Math.max(...cards.map((card) => Math.abs(card.value)), 0)

    const companies = Array.from(companyMap.values())
      .sort((a, b) => toNumber(b.realizatsiya_hajmi) - toNumber(a.realizatsiya_hajmi))

    const monthCards = months.map((month) => ({
      ...month,
      ishlab: toNumber(month.jami?.ishlab_hajmi),
      realiz: toNumber(month.jami?.realizatsiya_hajmi),
      eksport: toNumber(month.jami?.eksport_hajmi),
      qoldiq: toNumber(month.jami?.oy_oxiri_hajmi),
    }))

    const maxMonth = Math.max(...monthCards.map((month) => Math.max(month.ishlab, month.realiz, month.eksport)), 0)

    return {
      months,
      totals,
      cards,
      maxCard,
      companies,
      monthCards,
      maxMonth,
      alerts: buildAlerts(months),
    }
  }, [svod])

  const summary = useMemo(() => ({
    months: svod?.oylar?.length || 0,
    companies: svod?.korxonalar_soni || 0,
    reports: svod?.hisobotlar_soni || 0,
  }), [svod])

  const setFilterValue = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    if (!next.get('yil')) next.set('yil', String(currentYear))
    setLoading(true)
    setError('')
    setSearchParams(next)
  }

  const clearFilters = () => {
    setLoading(true)
    setError('')
    setSearchParams({ yil: String(currentYear) })
  }

  const hasFilter = filter.oy || filter.korxona || filter.yil !== String(currentYear)

  return (
    <div className="page-shell svod-page">
      <PageHeader
        eyebrow="Svod"
        title="Svod"
        description="Asosiy ko'rsatkichlar, oylar va korxonalar bo'yicha sodda yig'ma ko'rinish."
        icon={BarChart3}
        meta={<Badge tone="blue">{filter.yil} yil</Badge>}
        action={
          <Link to="/hisobotlar" className="btn btn-secondary">
            <FileSpreadsheet size={15} /> Hisobotlar
          </Link>
        }
      />

      <AlertBanner>{error}</AlertBanner>

      <div className="metric-grid">
        <MetricCard icon={Calendar} tone="blue" label="Oylar" value={loading ? '...' : summary.months} description="tanlangan davr" />
        <MetricCard icon={Building2} tone="teal" label="Korxonalar" value={loading ? '...' : summary.companies} description="hisobot berganlar" />
        <MetricCard icon={FileSpreadsheet} tone="amber" label="Hisobotlar" value={loading ? '...' : summary.reports} description="oylik hisobotlar" />
      </div>

      <Panel title="Filtrlar" description="Kerakli davr yoki korxonani tanlang" icon={SlidersHorizontal}>
        <div className="toolbar">
          <div className="toolbar-grid svod-filter-grid simple-svod-filter">
            <SelectField
              value={filter.korxona}
              onChange={(value) => setFilterValue('korxona', value)}
              options={[{ value: '', label: 'Barcha korxonalar' }, ...korxonalar.map((korxona) => ({ value: korxona.id, label: korxona.nomi }))]}
            />
            <SelectField
              value={filter.yil}
              onChange={(value) => setFilterValue('yil', value)}
              options={YIL_LIST.map((year) => ({ value: year, label: year }))}
            />
            <SelectField
              value={filter.oy}
              onChange={(value) => setFilterValue('oy', value)}
              options={[{ value: '', label: 'Barcha oylar' }, ...OY.slice(1).map((name, index) => ({ value: index + 1, label: name }))]}
            />
            {hasFilter && (
              <ActionButton variant="danger" onClick={clearFilters}>
                <X size={14} /> Tozalash
              </ActionButton>
            )}
          </div>
        </div>
      </Panel>

      {loading ? (
        <Panel className="mt-4">
          <LoadingBlock />
        </Panel>
      ) : !analytics.months.length ? (
        <Panel className="mt-4">
          <EmptyBlock
            icon={BarChart3}
            title="Svod topilmadi"
            description="Tanlangan filtrlar bo'yicha hisobot mavjud emas."
          />
        </Panel>
      ) : (
        <>
          <div className="simple-svod-grid">
            {analytics.cards.map((card) => {
              const Icon = card.icon
              const percent = analytics.maxCard ? Math.min(Math.abs(card.value) / analytics.maxCard * 100, 100) : 0
              return (
                <section className="simple-svod-card" key={card.key} style={{ '--card-color': card.color, '--card-tint': card.tint }}>
                  <header>
                    <span><Icon size={18} /></span>
                    <strong>{card.title}</strong>
                  </header>
                  <div className="simple-svod-card-body">
                    <div className="simple-donut" style={{ '--donut-percent': `${percent}%`, '--donut-color': card.color }}>
                      <span>{fmtCompact(card.value)}</span>
                      <small>dal</small>
                    </div>
                    <div className="simple-card-values">
                      {card.rows.map((row) => (
                        <div key={row.key}>
                          <span>{row.label}</span>
                          <strong>
                            {row.isPercent
                              ? `${(analytics.totals[row.key] || 0).toFixed(1)}%`
                              : fmt(analytics.totals[row.key], row.isSumma)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )
            })}
          </div>

          {analytics.alerts.length > 0 && (
            <div className="simple-alert-card">
              <AlertTriangle size={18} />
              <div>
                <strong>E'tibor kerak</strong>
                <div>
                  {analytics.alerts.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Panel title="Oylar bo'yicha" description="Har bir oy uchun qisqa svod" icon={Calendar} className="mt-4">
            <div className="month-card-grid">
              {analytics.monthCards.map((month) => (
                <div className="month-mini-card" key={month.oy}>
                  <header>
                    <strong>{month.oy_nomi}</strong>
                    <span>{month.korxonalar.length} ta korxona</span>
                  </header>
                  <MiniBar label="Ishlab" value={month.ishlab} max={analytics.maxMonth} color="#0f766e" />
                  <MiniBar label="Realiz." value={month.realiz} max={analytics.maxMonth} color="#2563eb" />
                  <MiniBar label="Eksport" value={month.eksport} max={analytics.maxMonth} color="#7c3aed" />
                  <footer>
                    <span>Qoldiq</span>
                    <strong>{fmt(month.qoldiq)}</strong>
                  </footer>
                </div>
              ))}
            </div>
          </Panel>


        </>
      )}
    </div>
  )
}

function MiniBar({ label, value, max, color }) {
  const width = max ? Math.max(value / max * 100, value > 0 ? 3 : 0) : 0
  return (
    <div className="mini-bar-row">
      <span>{label}</span>
      <div>
        <i style={{ width: `${width}%`, background: color }} />
      </div>
      <strong>{fmtCompact(value)}</strong>
    </div>
  )
}
