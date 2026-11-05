import { startTransition, useActionState, useRef } from 'react'
import { createDocument } from '../lib/documentStore.js'
import { IMPORT_ACCEPT, importFile } from '../lib/fileImport.js'
import { navigate } from '../lib/router.js'
import { showToast } from '../lib/toastStore.js'

/**
 * Opens the file picker, imports the chosen file as a new document and
 * opens it. Returns `{ pickFile, fileInput, isImporting }`; render
 * `fileInput` once anywhere in the component.
 */
export const useImportDocument = (folder = null) => {
  const inputRef = useRef(null)

  const [, importAction, isImporting] = useActionState(async (_previous, file) => {
    try {
      const { title, content } = await importFile(file)
      navigate(`/doc/${createDocument({ title, content, folder })}`)
    } catch (error) {
      showToast(error.message, { tone: 'error' })
    }
    return null
  }, null)

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      className="visually-hidden"
      accept={IMPORT_ACCEPT}
      tabIndex={-1}
      aria-hidden="true"
      onChange={(event) => {
        const [file] = event.target.files
        event.target.value = ''
        if (file) startTransition(() => importAction(file))
      }}
    />
  )

  return { pickFile: () => inputRef.current?.click(), fileInput, isImporting }
}
