import { AlertCircle, Loader2 } from 'lucide-react'

export function PageHeader({ eyebrow, title, description, icon: Icon, action, meta }) {
  return (
    <header className="page-header">
      <div className="page-heading">
        <div className="eyebrow">
          {Icon && <Icon size={15} />}
          {eyebrow}
        </div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="page-actions">
        {meta}
        {action}
      </div>
    </header>
  )
}

export function Panel({ title, description, icon: Icon, action, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      {(title || description || action) && (
        <div className="panel-header">
          <div className="panel-title">
            {Icon && (
              <span className="panel-icon">
                <Icon size={16} />
              </span>
            )}
            <span>
              {title && <strong>{title}</strong>}
              {description && <small>{description}</small>}
            </span>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function MetricCard({ label, value, description, icon: Icon, tone = 'blue', to, as: Component = 'div' }) {
  const Wrap = to ? Component : 'div'

  return (
    <Wrap to={to} className={`metric-card metric-${tone}`}>
      <div className="metric-top">
        <span className="metric-icon">{Icon && <Icon size={18} />}</span>
        <span className="metric-kicker">{label}</span>
      </div>
      <strong>{value}</strong>
      <p>{description}</p>
    </Wrap>
  )
}

export function AlertBanner({ children }) {
  if (!children) return null

  return (
    <div className="alert-banner">
      <AlertCircle size={16} />
      {children}
    </div>
  )
}

export function LoadingBlock({ label = 'Yuklanmoqda...' }) {
  return (
    <div className="state-block">
      <Loader2 size={22} className="animate-spin text-blue-600" />
      <span>{label}</span>
    </div>
  )
}

export function EmptyBlock({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-block">
      {Icon && (
        <span className="empty-icon">
          <Icon size={24} />
        </span>
      )}
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}

export function Badge({ children, tone = 'slate' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function ActionButton({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button type="button" className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function LinkButton({ children, variant = 'secondary', className = '', ...props }) {
  return (
    <a className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </a>
  )
}

export function IconButton({ label, children, variant = 'ghost', ...props }) {
  return (
    <button type="button" title={label} aria-label={label} className={`icon-btn icon-btn-${variant}`} {...props}>
      {children}
    </button>
  )
}

export function Field({ label, value, onChange, type = 'text', required = false, span = false, mono = false }) {
  return (
    <label className={`form-field ${span ? 'sm:col-span-2' : ''}`}>
      <span>{label}</span>
      <input
        type={type}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className={mono ? 'font-mono' : ''}
      />
    </label>
  )
}

export function SelectField({ label, value, onChange, options, required = false }) {
  return (
    <label className="form-field">
      {label && <span>{label}</span>}
      <select value={value} onChange={(event) => onChange(event.target.value)} required={required}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
