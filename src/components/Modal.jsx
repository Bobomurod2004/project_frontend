import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="modal-overlay">
      <button type="button" aria-label="Modalni yopish" className="modal-backdrop" onClick={onClose} />
      <section role="dialog" aria-modal="true" aria-label={title} className={`modal-card ${width}`}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Yopish" className="icon-btn">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  )
}
