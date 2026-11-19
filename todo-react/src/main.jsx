import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css' // ← Тут має бути styles.css, а не index.css
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)