import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { THEME } from './theme'

const applyTheme = () => {
  if (document.documentElement.getAttribute('data-doorin-theme') !== THEME) document.documentElement.setAttribute('data-doorin-theme', THEME)
}
applyTheme()
new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-doorin-theme'] })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
