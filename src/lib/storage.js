/**
 * A tiny IndexedDB wrapper: the whole library is stored as one record.
 * Libraries saved by earlier versions in localStorage are moved over once.
 */

const DB_NAME = 'doan-docs'
const STORE = 'library'
const KEY = 'library'
const LEGACY_KEY = 'doan-docs:library:v1'

const openDatabase = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

let database = null
const getDatabase = async () => {
  database ??= await openDatabase()
  return database
}

const run = async (mode, operation) => {
  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode)
    const request = operation(transaction.objectStore(STORE))
    transaction.oncomplete = () => resolve(request.result)
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

export const writeLibrary = (library) => run('readwrite', (store) => store.put(library, KEY))

export const readLibrary = async () => {
  try {
    const saved = await run('readonly', (store) => store.get(KEY))
    if (saved) return saved
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? 'null')
    if (legacy) {
      await writeLibrary(legacy)
      localStorage.removeItem(LEGACY_KEY)
    }
    return legacy
  } catch {
    // Storage unavailable (some private modes): start with the sample library.
    return null
  }
}
