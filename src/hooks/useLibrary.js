import { useSyncExternalStore } from 'react'
import { getState, subscribe } from '../lib/documentStore.js'

/** The whole library: `{ documents, notifications, profile, settings }`. */
export const useLibrary = () => useSyncExternalStore(subscribe, getState)
