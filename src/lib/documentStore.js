import { DAY, HOUR, MINUTE } from './dates.js'

import { readLibrary, writeLibrary } from './storage.js'
import { showToast } from './toastStore.js'

/**
 * Every document, the profile and settings live here, saved to this
 * browser's IndexedDB (which has room for images, unlike localStorage).
 * There is no server: nothing syncs between devices.
 * Components read it with useSyncExternalStore through useLibrary().
 * main.jsx calls loadLibrary() once before the first render.
 */

const SAVE_DELAY = 250

const makeId = () => crypto.randomUUID().slice(0, 8)

const paragraphs = (...lines) => lines.map((line) => `<p>${line}</p>`).join('')

const sampleDocuments = (now = Date.now()) => [
  {
    title: 'Project Plan',
    folder: 'projects',
    openedAt: now - 25 * MINUTE,
    starred: true,
    content: `<h1>Project Plan</h1><h2>Goal</h2>${paragraphs('Launch Doan Docs to the first group of testers by the end of the quarter.')}<h2>Milestones</h2><ol><li>Finish the editor</li><li>Word and PDF support</li><li>Invite testers</li></ol>`,
  },
  {
    title: 'Meeting Notes',
    folder: 'work',
    openedAt: now - 3 * HOUR,
    content: `<h1>Weekly sync</h1><h2>Decisions</h2><ul><li>Navy and gold is the final palette.</li><li>The book intro ships in the first release.</li></ul><h2>Action items</h2><ul><li>Draft the onboarding copy</li></ul>`,
  },
  {
    title: 'Product Roadmap',
    folder: 'projects',
    openedAt: now - DAY - 2 * HOUR,
    content: `<h1>Product Roadmap</h1><h2>Now</h2>${paragraphs('Document editor, templates and import.')}<h2>Next</h2>${paragraphs('Comments, page layout and PDF export.')}<h2>Later</h2>${paragraphs('Real-time collaboration.')}`,
  },
  {
    title: 'Quarterly Report',
    folder: 'work',
    openedAt: now - 3 * DAY,
    starred: true,
    content: `<h1>Quarterly Report</h1><p><em>Q3 summary</em></p><h2>Highlights</h2><ul><li>Revenue up 12%</li><li>Two new partners</li></ul>`,
  },
  {
    title: 'Design Specifications',
    folder: 'projects',
    openedAt: now - 5 * DAY,
    content: `<h1>Design Specifications</h1><h2>Colors</h2><ul><li>Royal Navy #14243B</li><li>Antique Gold #C9A65B</li><li>Parchment #F5F0E6</li></ul><h2>Type</h2>${paragraphs('Serif headings, sans-serif interface.')}`,
  },
  {
    title: 'Reading List',
    folder: 'personal',
    openedAt: now - 9 * DAY,
    content: `<h1>Reading List</h1><ul><li>The Name of the Rose</li><li>A Gentleman in Moscow</li><li>The Pillars of the Earth</li></ul>`,
  },
  {
    title: 'Team Handbook',
    folder: 'templates',
    openedAt: now - 14 * DAY,
    content: `<h1>Team Handbook</h1>${paragraphs('How we work, how we communicate and where to find things.')}`,
  },
].map((doc, index) => ({
  id: makeId(),
  starred: false,
  trashedAt: null,
  ...doc,
  createdAt: doc.openedAt - (index + 2) * DAY,
  updatedAt: doc.openedAt,
}))

const sampleNotifications = (now = Date.now()) => [
  { id: 'n3', text: 'Welcome to Doan Docs. Your library is saved in this browser.', at: now - 3 * DAY, read: true },
]

const DEFAULT_PAGE = { size: 'letter', orientation: 'portrait', margins: 'normal' }

const freshState = () => ({
  documents: sampleDocuments(),
  notifications: sampleNotifications(),
  profile: { name: 'Doan', email: 'doan@example.com' },
  settings: { showIntro: true, pageView: true, sound: true, seasonal: true, cat: true },
})

let state = freshState()
let saveTimer = null
let warnedAboutStorage = false
const listeners = new Set()

/** Sharing isn't built yet: drop what libraries saved before it was taken out. */
const withoutSharing = (library) => ({
  ...library,
  documents: library.documents.map(({ shared: _shared, owner: _owner, ...doc }) => doc),
  notifications: (library.notifications ?? []).filter((item) => item.id !== 'n1' && item.id !== 'n2'),
})

export const loadLibrary = async () => {
  const saved = await readLibrary()
  if (saved?.documents) state = withoutSharing({ ...freshState(), ...saved })
}

const save = () => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    try {
      await writeLibrary(state)
      warnedAboutStorage = false
    } catch {
      // Full disk or private browsing: keep working in memory, and say so once.
      if (!warnedAboutStorage) {
        showToast('Changes can’t be saved in this browser right now. Free up space, then keep editing.', { tone: 'error' })
        warnedAboutStorage = true
      }
    }
  }, SAVE_DELAY)
}

const commit = (nextState) => {
  state = nextState
  save()
  listeners.forEach((listener) => listener())
}

const updateDocuments = (update) => commit({ ...state, documents: update(state.documents) })

const patchDocument = (id, patch) =>
  updateDocuments((documents) => documents.map((doc) => (doc.id === id ? { ...doc, ...patch } : doc)))

// Reading ----------------------------------------------------------------

export const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getState = () => state

export const findDocument = (id) => state.documents.find((doc) => doc.id === id) ?? null

// Documents ---------------------------------------------------------------

export const createDocument = ({ title = 'Untitled document', content = '<p></p>', folder = null } = {}) => {
  const now = Date.now()
  const doc = {
    id: makeId(),
    title,
    content,
    folder,
    starred: false,
    trashedAt: null,
    createdAt: now,
    updatedAt: now,
    openedAt: now,
  }
  updateDocuments((documents) => [doc, ...documents])
  return doc.id
}

export const markOpened = (id) => patchDocument(id, { openedAt: Date.now() })

export const saveContent = (id, content) => patchDocument(id, { content, updatedAt: Date.now() })

export const renameDocument = (id, title) => {
  const trimmed = title.trim()
  if (trimmed) patchDocument(id, { title: trimmed, updatedAt: Date.now() })
}

export const moveDocument = (id, folder) => patchDocument(id, { folder })

export const pageSetupOf = (doc) => ({ ...DEFAULT_PAGE, ...doc?.page })

export const updatePageSetup = (id, page) => patchDocument(id, { page: { ...pageSetupOf(findDocument(id)), ...page } })

export const toggleStar = (id) => patchDocument(id, { starred: !findDocument(id)?.starred })

/** A sealed document is read-only until its seal is broken. */
export const sealDocument = (id) => patchDocument(id, { sealedAt: Date.now() })

export const breakSeal = (id) => patchDocument(id, { sealedAt: null })

export const duplicateDocument = (id) => {
  const original = findDocument(id)
  if (!original) return null
  const copyId = createDocument({ title: `Copy of ${original.title}`, content: original.content, folder: original.folder })
  if (original.page) patchDocument(copyId, { page: original.page })
  return copyId
}

export const trashDocument = (id) => patchDocument(id, { trashedAt: Date.now() })

export const restoreDocument = (id) => patchDocument(id, { trashedAt: null })

export const deleteForever = (id) => updateDocuments((documents) => documents.filter((doc) => doc.id !== id))

export const emptyTrash = () => updateDocuments((documents) => documents.filter((doc) => !doc.trashedAt))

// Profile, settings, notifications ---------------------------------------------

export const setProfileName = (name) => {
  const trimmed = name.trim()
  if (trimmed) commit({ ...state, profile: { ...state.profile, name: trimmed } })
}

export const setShowIntro = (showIntro) => commit({ ...state, settings: { ...state.settings, showIntro } })

export const setPageView = (pageView) => commit({ ...state, settings: { ...state.settings, pageView } })

export const setSound = (sound) => commit({ ...state, settings: { ...state.settings, sound } })

export const setSeasonal = (seasonal) => commit({ ...state, settings: { ...state.settings, seasonal } })

export const setCat = (cat) => commit({ ...state, settings: { ...state.settings, cat } })

export const markAllNotificationsRead = () =>
  commit({ ...state, notifications: state.notifications.map((item) => ({ ...item, read: true })) })

export const resetLibrary = () => commit(freshState())
