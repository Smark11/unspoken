import { useEffect, useState } from 'react'
import { CloseIcon } from './Icons'

type BeforeInstallPromptEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

const KEY = 'unspoken.install-dismissed'
const standalone = () =>
  (typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches) ||
  (navigator as unknown as { standalone?: boolean }).standalone === true

/** Offers Add to Home Screen once: a native prompt where the browser has one, a hint on iPhone. */
export function InstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent)

  useEffect(() => {
    let dismissed = false
    try { dismissed = localStorage.getItem(KEY) === '1' } catch { /* ignore */ }
    if (dismissed || standalone()) return
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as BeforeInstallPromptEvent); setShow(true) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    if (ios) setShow(true)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [ios])

  if (!show) return null
  const dismiss = () => { try { localStorage.setItem(KEY, '1') } catch { /* ignore */ } setShow(false) }
  const install = async () => {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setShow(false)
  }
  return (
    <div className="install">
      <div className="install-body">
        <b>Keep Unspoken on your home screen</b>
        <span className="small muted">
          {prompt ? 'Opens full screen, like an app.' : 'Tap Share, then “Add to Home Screen”.'}
        </span>
      </div>
      {prompt && <button type="button" className="btn" style={{ minHeight: 40, padding: '0 14px' }} onClick={install}>Add</button>}
      <button type="button" className="icon-btn" aria-label="Dismiss" onClick={dismiss}><CloseIcon size={16} /></button>
    </div>
  )
}
