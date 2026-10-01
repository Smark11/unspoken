import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import './styles/app.css'
import { applyTheme } from './lib/prefs'

applyTheme()
registerSW({ immediate: true })
window.addEventListener('hashchange', () => window.scrollTo({ top: 0 }))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
