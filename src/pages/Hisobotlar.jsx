import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { hisobotAPI, korxonaAPI } from '../api'
import Modal from '../components/Modal'
import {
  ArrowRight,
  Building2,
  Calendar,
  FileSpreadsheet,
  Info,
  Plus,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  ActionButton,
  AlertBanner,
  Badge,
  EmptyBlock,
  IconButton,
  LoadingBlock,
  MetricCard,
  PageHeader,
  Panel,
  SelectField,
} from '../components/ui'

const OY = ['', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
const YIL_LIST = Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index)
const currentYear = new Date().getFullYear()

const OY_TONES = [
  '', 'blue', 'blue', 'violet', 'emerald', 'teal', 'teal',
  'amber', 'amber', 'red', 'pink', 'violet', 'blue',
]

const initialForm = {
  korxona: '',
  yil: currentYear,
  oy: new Date().getMonth() + 1,
}

export default function Hisobotlar() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [korxonalar, setKorxonalar] = useState([])
  const [filter, setFilter] = useState({ korxona: '', yil: '', oy: '' })
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([
      hisobotAPI.list({ page_size: 200 }),
      korxonaAPI.list({ page_size: 300 }),
    ])
      .then(([reports, companies]) => {
        if (!active) return
        setList(reports.data.results || [])
        setKorxonalar(companies.data.results || [])
      })
      .catch(() => {
        if (active) setError("Hisobotlarni yuklashda xato yuz berdi")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const summary = useMemo(() => {
    const thisYear = list.filter((hisobot) => Number(hisobot.yil) === currentYear).length
    const uniqueCompanies = new Set(list.map((hisobot) => hisobot.korxona)).size
    return { total: list.length, thisYear, uniqueCompanies }
  }, [list])

  const load = (currentFilter = filter) => {
    setLoading(true)
    setError('')
    const params = { page_size: 200 }
    if (currentFilter.korxona) params.korxona = currentFilter.korxona
    if (currentFilter.yil) params.yil = currentFilter.yil
    if (currentFilter.oy) params.oy = currentFilter.oy

    hisobotAPI.list(params)
      .then((response) => setList(response.data.results || []))
      .catch(() => setError("Hisobotlarni yuklashda xato yuz berdi"))
      .finally(() => setLoading(false))
  }

  const setFilterValue = (key, value) => {
    const nextFilter = { ...filter, [key]: value }
    setFilter(nextFilter)
    load(nextFilter)
  }

  const clearFilters = () => {
    const nextFilter = { korxona: '', yil: '', oy: '' }
    setFilter(nextFilter)
    load(nextFilter)
  }

  const openCreateModal = () => {
    setForm(initialForm)
    setModal(true)
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!form.korxona) {
      toast.error('Korxona tanlang')
      return
    }

    setSaving(true)
    try {
      await hisobotAPI.create(form)
      toast.success('Hisobot yaratildi')
      setModal(false)
      load(filter)
    } catch (err) {
      const data = err.response?.data
      toast.error(data?.non_field_errors ? 'Bu davr uchun hisobot allaqachon mavjud' : 'Xato yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (hisobot) => {
    if (!confirm(`${hisobot.korxona_nomi} - ${hisobot.yil} ${OY[hisobot.oy]}\nHisobotni o'chirmoqchimisiz?`)) return

    try {
      await hisobotAPI.delete(hisobot.id)
      toast.success("Hisobot o'chirildi")
      load(filter)
    } catch {
      toast.error("Hisobotni o'chirishda xato yuz berdi")
    }
  }

  const hasFilter = filter.korxona || filter.yil || filter.oy

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Hisobotlar moduli"
        title="Oylik hisobotlar"
        description="Korxona, yil va oy kesimida hisobotlarni yaratish, filtrlash va ochish oynasi."
        icon={FileSpreadsheet}
        meta={hasFilter ? <Badge tone="blue">Filtr faol</Badge> : <Badge>Barcha hisobotlar</Badge>}
        action={
          <>
            <Link to="/svod" className="btn btn-secondary">
              <FileSpreadsheet size={16} /> Svod
            </Link>
            <ActionButton onClick={openCreateModal}>
              <Plus size={16} /> Yangi hisobot
            </ActionButton>
          </>
        }
      />

      <AlertBanner>{error}</AlertBanner>

      <div className="metric-grid">
        <MetricCard icon={FileSpreadsheet} tone="blue" label="Topildi" value={loading ? '...' : summary.total} description="joriy natija bo'yicha" />
        <MetricCard icon={Calendar} tone="amber" label={`${currentYear} yil`} value={loading ? '...' : summary.thisYear} description="shu yilga tegishli" />
        <MetricCard icon={Building2} tone="teal" label="Korxonalar" value={loading ? '...' : summary.uniqueCompanies} description="natijadagi tashkilotlar" />
      </div>

      <Panel title="Filtrlar" description="Kerakli davr yoki korxonani tanlang" icon={SlidersHorizontal}>
        <div className="toolbar">
          <div className="toolbar-grid">
            <SelectField
              value={filter.korxona}
              onChange={(value) => setFilterValue('korxona', value)}
              options={[{ value: '', label: 'Barcha korxonalar' }, ...korxonalar.map((korxona) => ({ value: korxona.id, label: korxona.nomi }))]}
            />
            <SelectField
              value={filter.yil}
              onChange={(value) => setFilterValue('yil', value)}
              options={[{ value: '', label: 'Barcha yillar' }, ...YIL_LIST.map((year) => ({ value: year, label: year }))]}
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

      <Panel
        title="Hisobotlar ro'yxati"
        description="Natijalar yangilangan sana bo'yicha ko'rsatiladi"
        icon={FileSpreadsheet}
      >
        {loading ? (
          <LoadingBlock />
        ) : list.length === 0 ? (
          <EmptyBlock
            icon={FileSpreadsheet}
            title="Hisobot topilmadi"
            description="Filtrlarni o'zgartiring yoki yangi hisobot yarating."
            action={
              <ActionButton onClick={openCreateModal}>
                <Plus size={15} /> Yangi hisobot
              </ActionButton>
            }
          />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table min-w-[900px]">
              <thead>
                <tr>
                  <th className="w-[54px]">№</th>
                  <th>Korxona</th>
                  <th>Yil</th>
                  <th>Oy</th>
                  <th>Yangilangan</th>
                  <th className="text-right">Amal</th>
                </tr>
              </thead>
              <tbody>
                {list.map((hisobot, index) => (
                  <tr key={hisobot.id}>
                    <td className="text-slate-400">{String(index + 1).padStart(2, '0')}</td>
                    <td>
                      <div className="entity-cell">
                        <span className="entity-icon"><Building2 size={15} /></span>
                        <span className="min-w-0">
                          <span className="entity-title">{hisobot.korxona_nomi}</span>
                          <span className="entity-subtitle">Hisobot ID: {hisobot.id}</span>
                        </span>
                      </div>
                    </td>
                    <td>{hisobot.yil}</td>
                    <td><Badge tone={OY_TONES[hisobot.oy]}>{OY[hisobot.oy]}</Badge></td>
                    <td>{formatDateTime(hisobot.yangilangan)}</td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link to={`/svod?korxona=${hisobot.korxona}&yil=${hisobot.yil}&oy=${hisobot.oy}`} className="btn btn-secondary !min-h-8 !px-3">
                          <FileSpreadsheet size={13} /> Svod
                        </Link>
                        <Link to={`/hisobotlar/${hisobot.id}`} className="btn btn-secondary !min-h-8 !px-3">
                          Ochish <ArrowRight size={13} />
                        </Link>
                        <IconButton label="O'chirish" variant="danger" onClick={() => handleDelete(hisobot)}>
                          <Trash2 size={14} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal open={modal} onClose={() => setModal(false)} title="Yangi oylik hisobot yaratish">
        <form onSubmit={handleCreate} className="space-y-5">
          <SelectField
            label="Korxona *"
            value={form.korxona}
            onChange={(value) => setForm({ ...form, korxona: value })}
            required
            options={[{ value: '', label: 'Tanlang...' }, ...korxonalar.map((korxona) => ({ value: korxona.id, label: korxona.nomi }))]}
          />

          <div className="form-grid sm:grid-cols-2">
            <SelectField
              label="Yil *"
              value={form.yil}
              onChange={(value) => setForm({ ...form, yil: Number(value) })}
              options={YIL_LIST.map((year) => ({ value: year, label: year }))}
            />
            <SelectField
              label="Oy *"
              value={form.oy}
              onChange={(value) => setForm({ ...form, oy: Number(value) })}
              options={OY.slice(1).map((name, index) => ({ value: index + 1, label: name }))}
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-[12px] font-bold text-blue-700">
            <Info size={15} className="mt-0.5 shrink-0" />
            <span>Hisobot yaratilganda mahsulot qatorlari avtomatik qo'shiladi.</span>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setModal(false)} className="btn btn-secondary">
              Bekor qilish
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Yaratilmoqda...' : 'Yaratish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
