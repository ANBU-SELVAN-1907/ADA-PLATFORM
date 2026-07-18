import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import '../design/tokens.css'

// Apply dark mode class before first render to avoid flash
document.documentElement.classList.add('dark')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)