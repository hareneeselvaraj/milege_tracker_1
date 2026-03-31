import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New version of UltraLog available. Reload to update?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('[UltraLog] App is ready for offline work')
  },
})
