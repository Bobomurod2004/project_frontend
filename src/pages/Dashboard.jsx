import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { korxonaAPI, hisobotAPI } from '../api'
import {
  Activity,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  TrendingUp,
} from 'lucide-react'
import { AlertBanner, Badge, EmptyBlock, LoadingBlock, MetricCard, PageHeader, Panel } from '../components/ui'

const OY = ['', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']

export default function Dashboard() {
  const [stats, setStats] = useState({ korxonalar: 0, hisobotlar: 0 })
  const [songgilar, setSonggilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([
      korxonaAPI.list({ page_size: 1 }),
      hisobotAPI.list({ page_size: 6 }),
    ])
      .then(([korxonalar, hisobotlar]) => {
        if (!active) return
        setStats({
          korxonalar: korxonalar.data.count || 0,
          hisobotlar: hisobotlar.data.count || 0,
        })
        setSonggilar(hisobotlar.data.results || [])
      })
      .catch(() => {
        if (active) setError("Ma'lumotlarni yuklashda xato yuz berdi")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const today = new Date()
  const currentPeriod = `${OY[today.getMonth() + 1]} ${today.getFullYear()}`

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Dashboard"
        title="Umumiy nazorat paneli"
        description="Korxonalar, oylik hisobotlar va oxirgi yangilanishlarni bitta joyda kuzatish uchun ishchi panel."
        icon={Activity}
        meta={<Badge tone="blue">{currentPeriod}</Badge>}
        action={
          <Link to="/hisobotlar" className="btn btn-primary">
            Hisobotlarga o'tish <ArrowRight size={15} />
          </Link>
        }
      />

      <AlertBanner>{error}</AlertBanner>

      <div className="metric-grid">
        <MetricCard
          as={Link}
          to="/korxonalar"
          icon={Building2}
          tone="teal"
          label="Korxonalar"
          value={loading ? '...' : stats.korxonalar}
          description="ro'yxatga olingan tashkilotlar"
        />
        <MetricCard
          as={Link}
          to="/hisobotlar"
          icon={FileText}
          tone="blue"
          label="Hisobotlar"
          value={loading ? '...' : stats.hisobotlar}
          description="barcha davrlar bo'yicha"
        />
        <MetricCard
          icon={Calendar}
          tone="amber"
          label="Joriy davr"
          value={OY[today.getMonth() + 1]}
          description={`${today.getFullYear()} yil uchun faol oy`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Panel
          title="So'nggi hisobotlar"
          description="Oxirgi yangilangan hisobotlar ro'yxati"
          icon={TrendingUp}
          action={
            <Link to="/hisobotlar" className="btn btn-secondary">
              Barchasi <ArrowRight size={14} />
            </Link>
          }
        >
          {loading ? (
            <LoadingBlock />
          ) : songgilar.length === 0 ? (
            <EmptyBlock
              icon={FileText}
              title="Hisobot mavjud emas"
              description="Birinchi oylik hisobotni yaratganingizdan keyin u shu yerda ko'rinadi."
              action={
                <Link to="/hisobotlar" className="btn btn-primary">
                  Hisobot yaratish
                </Link>
              }
            />
          ) : (
            <div className="data-table-wrap">
              <table className="data-table min-w-[780px]">
                <thead>
                  <tr>
                    <th>№</th>
                    <th>Korxona</th>
                    <th>Davr</th>
                    <th>Yangilangan</th>
                    <th className="text-right">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {songgilar.map((hisobot, index) => (
                    <tr key={hisobot.id}>
                      <td className="w-[54px] text-slate-400">{String(index + 1).padStart(2, '0')}</td>
                      <td>
                        <div className="entity-cell">
                          <span className="entity-icon"><Building2 size={15} /></span>
                          <span className="min-w-0">
                            <span className="entity-title">{hisobot.korxona_nomi}</span>
                            <span className="entity-subtitle">ID: {hisobot.id}</span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <Badge tone="blue">{OY[hisobot.oy]} {hisobot.yil}</Badge>
                      </td>
                      <td>{formatDate(hisobot.yangilangan)}</td>
                      <td className="text-right">
                        <Link to={`/hisobotlar/${hisobot.id}`} className="btn btn-secondary !min-h-8 !px-3">
                          Ochish <ArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Ish holati" description="Tizimdagi asosiy signal" icon={CheckCircle2}>
          <div className="divide-y divide-slate-100">
            <StatusRow label="Ma'lumotlar bazasi" value="Ulangan" tone="emerald" />
            <StatusRow label="Hisobot formati" value="PDF / Excel" tone="blue" />
            <StatusRow label="O'lchov birligi" value="dal, so'm" tone="amber" />
            <StatusRow label="Joriy oy" value={currentPeriod} tone="violet" />
          </div>
        </Panel>
      </div>
    </div>
  )
}

function StatusRow({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-[12px] font-bold text-slate-500">{label}</span>
      <Badge tone={tone}>{value}</Badge>
    </div>
  )
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
