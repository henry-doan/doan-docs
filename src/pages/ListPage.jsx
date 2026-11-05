import { useLibrary } from '../hooks/useLibrary.js'
import { emptyTrash } from '../lib/documentStore.js'
import { FOLDERS } from '../lib/folders.js'
import Bookshelf from '../components/Bookshelf.jsx'
import EmptyState from '../components/EmptyState.jsx'
import NewDocumentButton from '../components/NewDocumentButton.jsx'

const VIEWS = {
  recent: {
    title: 'Recent',
    subtitle: 'Everything you’ve opened, newest first.',
    filter: (doc) => !doc.trashedAt,
    empty: ['Nothing here yet', 'Documents you open will appear here.'],
  },
  starred: {
    title: 'Starred',
    subtitle: 'Your most important documents.',
    filter: (doc) => !doc.trashedAt && doc.starred,
    empty: ['No starred documents', 'Star a document to keep it close at hand.'],
  },
  trash: {
    title: 'Trash',
    subtitle: 'Restore documents or delete them for good.',
    filter: (doc) => Boolean(doc.trashedAt),
    empty: ['Trash is empty', 'Documents you delete will wait here until you remove them.'],
  },
}

const folderView = (folderId) => {
  const folder = FOLDERS.find((item) => item.id === folderId)
  return folder
    ? {
        title: folder.name,
        subtitle: `Documents in your ${folder.name} folder.`,
        filter: (doc) => !doc.trashedAt && doc.folder === folder.id,
        empty: [`${folder.name} is empty`, 'Create a document here, or move one in from its ⋯ menu.'],
        folder: folder.id,
      }
    : null
}

/** Recent, Starred, Trash and folder views share this page. */
const ListPage = ({ view, folderId, query }) => {
  const { documents } = useLibrary()
  const config = view === 'folder' ? folderView(folderId) : VIEWS[view]

  if (!config) {
    return <EmptyState title="Folder not found" message="It may have been renamed." action={<a className="text-link" href="#/home">Back to Home</a>} />
  }

  const isTrash = view === 'trash'
  const inView = documents.filter(config.filter)
  const matches = query ? inView.filter((doc) => doc.title.toLowerCase().includes(query)) : inView

  return (
    <div className="list-page">
      <title>{`${config.title} – Doan Docs`}</title>
      <header className="page-header">
        <div>
          <h1>{config.title}</h1>
          <p>{config.subtitle}</p>
        </div>
        {isTrash ? (
          inView.length > 0 && (
            <button type="button" className="button button-danger-outline" onClick={emptyTrash}>
              Empty trash
            </button>
          )
        ) : (
          <NewDocumentButton folder={config.folder ?? null} />
        )}
      </header>

      {matches.length > 0 ? (
        <Bookshelf documents={matches} isTrash={isTrash} showFolderFilter={view !== 'folder'} label={config.title} />
      ) : (
        <EmptyState
          title={query ? 'No matching documents' : config.empty[0]}
          message={query ? `Nothing in ${config.title} matches “${query}”.` : config.empty[1]}
        />
      )}
    </div>
  )
}

export default ListPage
