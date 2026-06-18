import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Building2,
  ChevronRight,
  FileSpreadsheet,
  LayoutDashboard,
  Menu,
  X,
} from 'lucide-react'

const nav = [
  { to: '/', label: 'Bosh sahifa', icon: LayoutDashboard, end: true },
  { to: '/korxonalar', label: 'Korxonalar', icon: Building2 },
  { to: '/hisobotlar', label: 'Hisobotlar', icon: FileSpreadsheet },
]

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="app-shell">
      <div className="mobile-bar">
        <Brand compact />
        <button type="button" className="icon-btn" onClick={() => setMobileOpen(true)} aria-label="Menyuni ochish">
          <Menu size={18} />
        </button>
      </div>

      {mobileOpen && (
        <button
          type="button"
          className="mobile-backdrop"
          aria-label="Menyuni yopish"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Brand />
          <button
            type="button"
            className="ml-auto grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Menyuni yopish"
          >
            <X size={16} />
          </button>
        </div>

        <div className="sidebar-rule" />

        <nav>
          <p className="nav-section-label">Navigatsiya</p>
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <span className="nav-main">
                    <Icon size={16} />
                    <span>{label}</span>
                  </span>
                  {isActive && <ChevronRight size={14} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-info">
          <strong>Hisobot standarti</strong>
          <div className="sidebar-info-row">
            <span>Hajm</span>
            <span>dal</span>
          </div>
          <div className="sidebar-info-row">
            <span>Summa</span>
            <span>so'm</span>
          </div>
          <div className="sidebar-info-row">
            <span>Format</span>
            <span>PDF / Excel</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <Outlet />
      </main>
    </div>
  )
}

function Brand({ compact = false }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="brand-mark">
        <FileSpreadsheet size={19} />
      </span>
      <span className="brand-copy min-w-0">
        <strong className={compact ? '!text-slate-950' : ''}>Hisobot</strong>
        <span className={compact ? '!text-slate-500' : ''}>Korxonalar nazorati</span>
      </span>
    </div>
  )
}
