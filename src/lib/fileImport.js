import { htmlToText, sanitizeHtml, textToHtml } from './sanitize.js'

export const IMPORT_ACCEPT = '.txt,.md,.html,.htm'
export const IMPORT_FORMATS_LABEL = 'text and web page'

const titleFrom = (fileName) => fileName.replace(/\.[^.]+$/, '') || 'Imported document'
const extensionOf = (fileName) => fileName.split('.').pop().toLowerCase()

const READERS = {
  html: async (file) => sanitizeHtml(await file.text()),
  htm: async (file) => sanitizeHtml(await file.text()),
  txt: async (file) => textToHtml(await file.text()),
  md: async (file) => textToHtml(await file.text()),
}

/** Reads a file from the person's device into `{ title, content }` editor HTML. */
export const importFile = async (file) => {
  const read = READERS[extensionOf(file.name)]
  if (!read) throw new Error('Doan Docs can open text (.txt, .md) and web page (.html) files for now.')
  const content = await read(file)
  return { title: titleFrom(file.name), content: content.trim() ? content : '<p></p>' }
}

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement('a'), { href: url, download: fileName })
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const safeFileName = (title) => title.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'Untitled document'

export const EXPORT_FORMATS = [
  { id: 'txt', label: 'Plain text (.txt)' },
  { id: 'html', label: 'Web page (.html)' },
]

/** Exported web pages keep the illuminated first letters. */
const EXPORT_STYLE =
  'p[data-drop-cap]::first-letter{float:left;margin:.06em .12em 0 0;padding:.06em .14em;' +
  'border:2px solid #c9a65b;border-radius:4px;background:#14243b;color:#e4c783;' +
  'font:600 3.4em/.9 Cinzel,"Trajan Pro","Times New Roman",serif}'

export const downloadDocument = ({ title, content }, format) => {
  const blob =
    format === 'txt'
      ? new Blob([htmlToText(content)], { type: 'text/plain;charset=utf-8' })
      : new Blob(
          [`<!doctype html><html><head><meta charset="utf-8"><title>${safeFileName(title)}</title><style>${EXPORT_STYLE}</style></head><body>${content}</body></html>`],
          { type: 'text/html;charset=utf-8' },
        )
  downloadBlob(blob, `${safeFileName(title)}.${format}`)
}
