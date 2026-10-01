import { useEffect, type ReactNode } from 'react'
import { CloseIcon } from './Icons'

/** Bottom sheet. Closes on backdrop tap or Escape. */
export function Sheet({ title, open, onClose, children }: { title: string; open: boolean; onClose(): void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grab" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><CloseIcon size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
