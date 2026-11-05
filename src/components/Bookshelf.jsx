import { useState } from 'react'
import sealArt from '../assets/seal.webp'
import { formatWhen } from '../lib/dates.js'
import { toggleStar } from '../lib/documentStore.js'
import { FOLDERS, folderName } from '../lib/folders.js'
import { navigate } from '../lib/router.js'
import DocumentActions from './DocumentActions.jsx'
import Icon from './Icon.jsx'
import SirPounce from './SirPounce.jsx'

const SORTERS = {
  opened: (a, b) => b.openedAt - a.openedAt,
  title: (a, b) => a.title.localeCompare(b.title),
  folder: (a, b) => folderName(a.folder).localeCompare(folderName(b.folder)) || b.openedAt - a.openedAt,
  deleted: (a, b) => b.trashedAt - a.trashedAt,
}

/** Each folder has its own leather; documents outside a folder are plum. */
const LEATHER = {
  personal: '#6e1f2a',
  work: '#1f4a3a',
  projects: '#1c3150',
  templates: '#5a3a1e',
}
const NO_FOLDER_LEATHER = '#3e2a55'

/** Small, stable variations from the id, so a book keeps its size between visits. */
const hashOf = (text) => [...text].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7)

const spineStyle = (doc) => {
  const hash = hashOf(doc.id)
  return {
    '--leather': LEATHER[doc.folder] ?? NO_FOLDER_LEATHER,
    '--spine-h': `${150 + (hash % 46)}px`,
    '--spine-w': `${42 + ((hash >> 6) % 14)}px`,
  }
}

const PULL_MS = 380

/** A document as a book standing on the shelf. */
const Book = ({ doc, isTrash, isPulling, onPull }) => {
  const when = formatWhen(isTrash ? doc.trashedAt : doc.openedAt)
  const details = [
    isTrash ? `Deleted ${when.toLowerCase()}` : `Opened ${when.toLowerCase()}`,
    folderName(doc.folder),
    doc.sealedAt && 'Sealed',
  ].filter(Boolean)

  const spine = (
    <>
      <span className="spine-title">{doc.title}</span>
      <span className="visually-hidden">, {details.join(', ')}</span>
      {doc.sealedAt && <img className="spine-seal" src={sealArt} alt="" draggable="false" />}
    </>
  )

  return (
    <li className={`shelf-book ${isTrash ? 'is-trashed' : ''} ${isPulling ? 'is-pulling' : ''}`} style={spineStyle(doc)}>
      {doc.starred && <span className="book-ribbon" aria-hidden="true" />}
      {isTrash ? (
        <span className="book-spine">{spine}</span>
      ) : (
        <a
          className="book-spine"
          href={`#/doc/${doc.id}`}
          onClick={(event) => {
            // Let modified clicks open the book in a new tab as usual.
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
            event.preventDefault()
            onPull(doc.id)
          }}
        >
          {spine}
        </a>
      )}

      <div className="book-label" aria-hidden="true">
        <strong>{doc.title}</strong>
        <span>{details.join(' · ')}</span>
      </div>

      <div className="book-tools">
        {!isTrash && (
          <button
            type="button"
            className={`icon-button book-star ${doc.starred ? 'is-starred' : ''}`}
            aria-label={doc.starred ? `Unstar ${doc.title}` : `Star ${doc.title}`}
            aria-pressed={doc.starred}
            onClick={() => toggleStar(doc.id)}
          >
            <Icon name={doc.starred ? 'starFilled' : 'star'} size={16} />
          </button>
        )}
        <DocumentActions doc={doc} />
      </div>
    </li>
  )
}

/**
 * Documents as books on a wooden bookcase, used by the dashboard and every
 * list view. Books are colored by folder; opening one slides it off the shelf.
 */
const Bookshelf = ({ documents, isTrash = false, limit, showFolderFilter = false, label }) => {
  const [sort, setSort] = useState(isTrash ? 'deleted' : 'opened')
  const [folder, setFolder] = useState('all')
  const [pulling, setPulling] = useState(null)

  const filtered = folder === 'all' ? documents : documents.filter((doc) => (doc.folder ?? 'none') === folder)
  const books = filtered.toSorted(SORTERS[sort]).slice(0, limit ?? filtered.length)

  const pull = (id) => {
    setPulling(id)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setTimeout(() => navigate(`/doc/${id}`), reduced ? 0 : PULL_MS)
  }

  return (
    <div className="bookshelf">
      <div className="shelf-controls">
        <label className="select-field">
          <span className="visually-hidden">Sort books</span>
          <Icon name="sort" size={16} />
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value={isTrash ? 'deleted' : 'opened'}>{isTrash ? 'Recently deleted' : 'Recently opened'}</option>
            <option value="title">Title</option>
            <option value="folder">Folder</option>
          </select>
        </label>
        {showFolderFilter && (
          <label className="select-field">
            <span className="visually-hidden">Filter by folder</span>
            <Icon name="folder" size={16} />
            <select value={folder} onChange={(event) => setFolder(event.target.value)}>
              <option value="all">All folders</option>
              <option value="none">My Docs</option>
              {FOLDERS.map((option) => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="bookcase-wrap">
        <SirPounce />
        <ul className="bookcase" aria-label={label}>
          {books.map((doc) => (
            <Book key={doc.id} doc={doc} isTrash={isTrash} isPulling={pulling === doc.id} onPull={pull} />
          ))}
        </ul>
      </div>
      {books.length === 0 && folder !== 'all' && <p className="shelf-empty">No books from this folder.</p>}
    </div>
  )
}

export default Bookshelf
