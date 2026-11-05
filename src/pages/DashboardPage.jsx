import { useLibrary } from '../hooks/useLibrary.js'
import { useImportDocument } from '../hooks/useImportDocument.jsx'
import { greetingFor } from '../lib/dates.js'
import { createDocument } from '../lib/documentStore.js'
import { navigate } from '../lib/router.js'
import { currentSeason } from '../lib/seasons.js'
import Bookshelf from '../components/Bookshelf.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Icon from '../components/Icon.jsx'
import { CastleScene, Quill } from '../components/Illustrations.jsx'
import NewDocumentButton from '../components/NewDocumentButton.jsx'

const GreetingSection = ({ name, holiday }) => (
  <section className="greeting">
    <div>
      {holiday && <p className="holiday-ribbon">{holiday.message}</p>}
      <h1>
        {greetingFor()}, {name}
      </h1>
      <p>Create and edit on your documents.</p>
    </div>
    <NewDocumentButton />
  </section>
)

const QuickActionCard = ({ icon, title, description, onClick, busy }) => (
  <button type="button" className="quick-card" onClick={onClick} disabled={busy}>
    <span className="quick-card-icon" aria-hidden="true">
      <Icon name={icon} size={22} />
    </span>
    <span className="quick-card-text">
      <strong>{title}</strong>
      <span>{busy ? 'Opening…' : description}</span>
    </span>
  </button>
)

const QuickAccessPanel = ({ counts }) => {
  const links = [
    { path: '/recent', label: 'Recent', icon: 'clock' },
    { path: '/starred', label: 'Starred', icon: 'star', count: counts.starred },
    { path: '/templates', label: 'Templates', icon: 'template' },
  ]
  return (
    <aside className="quick-access" aria-labelledby="quick-access-title">
      <CastleScene className="quick-access-castle" />
      <h2 id="quick-access-title">Quick access</h2>
      <ul>
        {links.map((link) => (
          <li key={link.path}>
            <a href={`#${link.path}`}>
              <Icon name={link.icon} size={18} />
              <span>{link.label}</span>
              {link.count > 0 && <span className="nav-count">{link.count}</span>}
            </a>
          </li>
        ))}
      </ul>
      <figure className="quick-access-quote">
        <Quill size={34} />
        <blockquote>Great ideas deserve a place to grow.</blockquote>
      </figure>
    </aside>
  )
}

const DashboardPage = ({ query }) => {
  const { documents, profile, settings } = useLibrary()
  const { pickFile, fileInput, isImporting } = useImportDocument()
  const live = documents.filter((doc) => !doc.trashedAt)
  const matches = query ? live.filter((doc) => doc.title.toLowerCase().includes(query)) : live

  return (
    <div className="dashboard">
      <title>Home – Doan Docs</title>
      <div className="dashboard-main">
        <GreetingSection name={profile.name} holiday={settings.seasonal !== false ? currentSeason().holiday : null} />

        <div className="quick-cards">
          <QuickActionCard
            icon="file"
            title="Blank Document"
            description="Start from scratch"
            onClick={() => navigate(`/doc/${createDocument()}`)}
          />
          <QuickActionCard icon="template" title="Templates" description="Choose a template" onClick={() => navigate('/templates')} />
          <QuickActionCard icon="upload" title="Import" description="From your device" onClick={pickFile} busy={isImporting} />
          {fileInput}
        </div>

        <section className="recent" aria-labelledby="recent-title">
          <div className="section-header">
            <h2 id="recent-title">{query ? `Results for “${query}”` : 'Recent documents'}</h2>
            {!query && <a className="text-link" href="#/recent">View all</a>}
          </div>
          {matches.length > 0 ? (
            <Bookshelf documents={matches} limit={query ? undefined : 12} label="Recent documents" />
          ) : (
            <EmptyState
              title={query ? 'No matching documents' : 'Your library is empty'}
              message={query ? 'Try a different title.' : 'Create a document to get started.'}
              action={!query && <NewDocumentButton />}
            />
          )}
        </section>
      </div>

      <QuickAccessPanel counts={{ starred: live.filter((doc) => doc.starred).length }} />
    </div>
  )
}

export default DashboardPage
