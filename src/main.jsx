import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { loadLibrary } from './lib/documentStore.js'
import { installInkSplash } from './lib/inkSplash.js'
import './styles.css'

// The library is read from IndexedDB before the first render, so pages never
// flash the sample data before your own documents appear.
await loadLibrary()
installInkSplash()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
