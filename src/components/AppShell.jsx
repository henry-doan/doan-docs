import { useState } from 'react'
import { useLibrary } from '../hooks/useLibrary.js'
import { DeskAmbience } from './Ambience.jsx'
import AppHeader from './AppHeader.jsx'
import Sidebar from './Sidebar.jsx'

const countsFor = (documents) => {
  const live = documents.filter((doc) => !doc.trashedAt)
  const counts = {
    '/starred': live.filter((doc) => doc.starred).length,
    '/trash': documents.length - live.length,
  }
  for (const doc of live) {
    if (doc.folder) counts[`/folder/${doc.folder}`] = (counts[`/folder/${doc.folder}`] ?? 0) + 1
  }
  return counts
}

/** Header, sidebar and the page. `children` is a function of the search query. */
const AppShell = ({ currentPath, children }) => {
  const { documents, settings } = useLibrary()
  const [query, setQuery] = useState('')
  const [isNavOpen, setIsNavOpen] = useState(false)

  return (
    <div className="app-shell">
      <button type="button" className="skip-link" onClick={() => document.getElementById('main')?.focus()}>
        Skip to content
      </button>
      <AppHeader query={query} onQueryChange={setQuery} onOpenNav={() => setIsNavOpen(true)} />
      <div className="app-body">
        <Sidebar
          currentPath={currentPath}
          counts={countsFor(documents)}
          isOpen={isNavOpen}
          onClose={() => setIsNavOpen(false)}
        />
        {/* The desk sits behind the page and stays put while the page scrolls. */}
        <div className="app-stage">
          <DeskAmbience seasonal={settings.seasonal !== false} />
          <main id="main" className="app-main" tabIndex={-1}>
            {children(query.trim().toLowerCase())}
          </main>
        </div>
      </div>
    </div>
  )
}

export default AppShell
