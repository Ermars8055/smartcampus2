import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'

Sentry.init({
  dsn: "https://d08362dab5ef419b8e8f887896e3b058@app.glitchtip.com/28368",
  tracesSampleRate: 0.01,
  autoSessionTracking: false,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
