import { useEffect, useMemo, useState } from 'react'
import { korxonaAPI } from '../api'
import Modal from '../components/Modal'
import {
  Building2,
  CheckCircle2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  ActionButton,
  AlertBanner,
  Badge,
  EmptyBlock,
  Field,
  IconButton,
  LoadingBlock,
  MetricCard,
  PageHeader,
  Panel,
} from '../components/ui'

const EMPTY = { nomi: '', inn: '', manzil: '', rahbar: '', telefon: '', email: '', is_active: true }

export default function Korxonalar() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    korxonaAPI.list({ page_size: 200 })
      .then((response) => {
        if (active) setList(response.data.results || [])
      })
      .catch(() => {
        if (active) setError("Korxonalar ro'yxatini yuklashda xato yuz berdi")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const summary = useMemo(() => {
    const active = list.filter((korxona) => korxona.is_active).length
    return {
      all: list.length,
      active,
      inactive: list.length - active,
    }
  }, [list])

  const load = (query = '') => {
    setLoading(true)
    setError('')
    korxonaAPI.list({ search: query, page_size: 200 })
      .then((response) => setList(response.data.results || []))
      .catch(() => setError("Korxonalar ro'yxatini yuklashda xato yuz berdi"))
      .finally(() => setLoading(false))
  }

  const openCreate = () => {
    setForm(EMPTY)
    setSelected(null)
    setModal('create')
  }

  const openEdit = (korxona) => {
    setForm({ ...korxona })
    setSelected(korxona)
    setModal('edit')
  }

  const closeModal = () => {
    setModal(null)
    setSelected(null)
  }

  const handleSearchChange = (event) => {
    const value = event.target.value
    setSearch(value)
    load(value)
  }

  const clearSearch = () => {
    setSearch('')
    load('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      if (modal === 'create') {
        await korxonaAPI.create(form)
        toast.success("Korxona qo'shildi")
      } else {
        await korxonaAPI.update(selected.id, form)
        toast.success('Maʼlumotlar yangilandi')
      }
      closeModal()
      load(search)
    } catch (err) {
      const data = err.response?.data
      toast.error(data?.inn?.[0] || data?.nomi?.[0] || 'Xato yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (korxona) => {
    if (!confirm(`"${korxona.nomi}" korxonasini o'chirmoqchimisiz?`)) return

    try {
      await korxonaAPI.delete(korxona.id)
      toast.success("Korxona o'chirildi")
      load(search)
    } catch {
      toast.error("Korxonani o'chirishda xato yuz berdi")
    }
  }

  const updateField = (key, value) => setForm((previous) => ({ ...previous, [key]: value }))

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Ma'lumotnoma"
        title="Korxonalar reyestri"
        description="Korxonalar ro'yxati, aloqa ma'lumotlari va faol holatini boshqarish oynasi."
        icon={Building2}
        action={
          <ActionButton onClick={openCreate}>
            <Plus size={16} /> Korxona qo'shish
          </ActionButton>
        }
      />

      <AlertBanner>{error}</AlertBanner>

      <div className="metric-grid">
        <MetricCard icon={Building2} tone="blue" label="Jami" value={loading ? '...' : summary.all} description="ko'rinayotgan korxonalar" />
        <MetricCard icon={CheckCircle2} tone="teal" label="Faol" value={loading ? '...' : summary.active} description="ishlatilayotgan korxonalar" />
        <MetricCard icon={XCircle} tone="amber" label="Nofaol" value={loading ? '...' : summary.inactive} description="vaqtincha belgilangani" />
      </div>

      <Panel
        title="Korxonalar ro'yxati"
        description="Nomi, INN, rahbar va aloqa bo'yicha tezkor ko'rish"
        icon={Building2}
      >
        <div className="toolbar">
          <div className="search-field w-full max-w-[460px]">
            <Search size={16} />
            <input value={search} onChange={handleSearchChange} placeholder="Korxona nomi yoki INN bo'yicha qidirish" />
            {search && (
              <button type="button" className="search-clear" onClick={clearSearch} aria-label="Qidiruvni tozalash">
                <X size={14} />
              </button>
            )}
          </div>
          <Badge tone={search ? 'blue' : 'slate'}>{search ? 'Qidiruv faol' : 'Barcha yozuvlar'}</Badge>
        </div>

        {loading ? (
          <LoadingBlock />
        ) : list.length === 0 ? (
          <EmptyBlock
            icon={Building2}
            title="Korxona topilmadi"
            description="Qidiruvni o'zgartiring yoki yangi korxonani reyestrga qo'shing."
            action={
              <ActionButton onClick={openCreate}>
                <Plus size={15} /> Yangi korxona
              </ActionButton>
            }
          />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table min-w-[1080px]">
              <thead>
                <tr>
                  <th className="w-[54px]">№</th>
                  <th>Korxona</th>
                  <th>INN</th>
                  <th>Rahbar</th>
                  <th>Aloqa</th>
                  <th className="text-center">Holat</th>
                  <th className="text-right">Amal</th>
                </tr>
              </thead>
              <tbody>
                {list.map((korxona, index) => (
                  <tr key={korxona.id}>
                    <td className="text-slate-400">{String(index + 1).padStart(2, '0')}</td>
                    <td>
                      <div className="entity-cell">
                        <span className="entity-icon"><Building2 size={15} /></span>
                        <span className="min-w-0">
                          <span className="entity-title">{korxona.nomi}</span>
                          <span className="entity-subtitle">{korxona.manzil || 'Manzil kiritilmagan'}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[12px] font-black text-slate-700">
                        {korxona.inn}
                      </span>
                    </td>
                    <td>{korxona.rahbar || <span className="text-slate-400">Kiritilmagan</span>}</td>
                    <td>
                      <div className="space-y-1">
                        <ContactLine icon={<Phone size={12} />} value={korxona.telefon} fallback="Telefon yo'q" />
                        <ContactLine icon={<Mail size={12} />} value={korxona.email} fallback="Email yo'q" />
                      </div>
                    </td>
                    <td className="text-center">
                      {korxona.is_active ? (
                        <Badge tone="emerald"><CheckCircle2 size={12} /> Faol</Badge>
                      ) : (
                        <Badge tone="red"><XCircle size={12} /> Nofaol</Badge>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <IconButton label="Tahrirlash" onClick={() => openEdit(korxona)}>
                          <Pencil size={14} />
                        </IconButton>
                        <IconButton label="O'chirish" variant="danger" onClick={() => handleDelete(korxona)}>
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

      <Modal
        open={!!modal}
        onClose={closeModal}
        title={modal === 'create' ? "Yangi korxona qo'shish" : "Korxona ma'lumotlarini tahrirlash"}
        width="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="form-grid sm:grid-cols-2">
            <Field label="Korxona nomi" value={form.nomi} onChange={(value) => updateField('nomi', value)} required span />
            <Field label="INN" value={form.inn} onChange={(value) => updateField('inn', value)} required mono />
            <Field label="Rahbar F.I.O" value={form.rahbar} onChange={(value) => updateField('rahbar', value)} />
            <Field label="Telefon" value={form.telefon} onChange={(value) => updateField('telefon', value)} />
            <Field label="Email" type="email" value={form.email} onChange={(value) => updateField('email', value)} />
            <Field label="Manzil" value={form.manzil} onChange={(value) => updateField('manzil', value)} span />
          </div>

          {modal === 'edit' && (
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <span>
                <span className="block text-[13px] font-black text-slate-900">Korxona faol holati</span>
                <span className="mt-1 block text-[12px] font-semibold text-slate-500">Nofaol korxona ro'yxatda alohida belgi bilan ko'rinadi.</span>
              </span>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => updateField('is_active', event.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-teal-700"
              />
            </label>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={closeModal} className="btn btn-secondary">
              Bekor qilish
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function ContactLine({ icon, value, fallback }) {
  return (
    <span className={`flex min-w-0 items-center gap-1.5 text-[12px] font-semibold ${value ? 'text-slate-600' : 'text-slate-400'}`}>
      <span className="shrink-0 text-slate-400">{icon}</span>
      <span className="truncate">{value || fallback}</span>
    </span>
  )
}
