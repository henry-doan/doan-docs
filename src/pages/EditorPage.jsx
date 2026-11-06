import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import sealArt from '../assets/seal.webp'
import { useLibrary } from '../hooks/useLibrary.js'
import { formatWhen } from '../lib/dates.js'
import {
  breakSeal,
  markOpened,
  pageSetupOf,
  renameDocument,
  saveContent,
  sealDocument,
  setPageView,
  toggleStar,
  updatePageSetup,
} from '../lib/documentStore.js'
import { EXPORT_FORMATS, downloadDocument } from '../lib/fileImport.js'
import { dismissToast, showToast } from '../lib/toastStore.js'
import EmptyState from '../components/EmptyState.jsx'
import Icon from '../components/Icon.jsx'
import Logo from '../components/Logo.jsx'
import Menu from '../components/Menu.jsx'
import { PouncePeek } from '../components/SirPounce.jsx'
import ContextBar from '../editor/ContextBar.jsx'
import EditorToolbar from '../editor/EditorToolbar.jsx'
import { createExtensions } from '../editor/extensions.js'
import { fitToWidth, isImageFile, prepareImage } from '../editor/images.js'
import PageSetupDialog from '../editor/PageSetupDialog.jsx'
import { PAGE_GAP, pageLayout } from '../editor/pageSetup.js'

const SAVE_DELAY = 600
/** How long the seal takes to crack apart before the document unlocks. */
const BREAK_MS = 700

/**
 * A box the editor's plugins can read from at any time. Values are put in
 * from effects; the plugins read them later, never during render.
 */
const createSlot = () => {
  let value = null
  return { get: () => value, set: (next) => { value = next } }
}

/** True when the window is wide enough to show whole sheets of paper. */
const useFitsWidth = (width) =>
  useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(`(min-width: ${width + 48}px)`)
      query.addEventListener('change', onChange)
      return () => query.removeEventListener('change', onChange)
    },
    () => window.matchMedia(`(min-width: ${width + 48}px)`).matches,
  )

const blockOf = (editor) => {
  for (const level of [1, 2, 3]) {
    if (editor.isActive('heading', { level })) return `h${level}`
  }
  return editor.isActive('blockquote') ? 'quote' : 'paragraph'
}

/** Everything the toolbars show, recomputed only when it actually changes. */
const selectState = ({ editor }) => {
  if (!editor) return null
  return {
    canUndo: editor.can().undo(),
    canRedo: editor.can().redo(),
    bold: editor.isActive('bold'),
    italic: editor.isActive('italic'),
    underline: editor.isActive('underline'),
    strike: editor.isActive('strike'),
    bulletList: editor.isActive('bulletList'),
    orderedList: editor.isActive('orderedList'),
    color: editor.getAttributes('textStyle').color ?? null,
    align: ['center', 'right', 'justify'].find((side) => editor.isActive({ textAlign: side })) ?? 'left',
    block: blockOf(editor),
    dropCap: editor.isActive('paragraph') && Boolean(editor.getAttributes('paragraph').dropCap),
    inParagraph: editor.isActive('paragraph'),
    inTable: editor.isActive('table'),
    headerRow: editor.isActive('tableHeader'),
    canMerge: editor.can().mergeCells(),
    canSplit: editor.can().splitCell(),
    image: editor.isActive('image') ? editor.getAttributes('image') : null,
  }
}

const Editor = ({ doc, pageViewSetting }) => {
  const page = pageSetupOf(doc)
  const layout = pageLayout(page)
  const fitsWidth = useFitsWidth(layout.width)
  const showPages = pageViewSetting && fitsWidth

  const [title, setTitle] = useState(doc.title)
  const [status, setStatus] = useState('Saved')
  // Each save stamps the wax seal again; the count is its key.
  const [saves, setSaves] = useState(0)
  const sealed = Boolean(doc.sealedAt)
  const [sealMotion, setSealMotion] = useState(null)
  const [pages, setPages] = useState(1)
  const [isPageSetupOpen, setIsPageSetupOpen] = useState(false)
  const saveTimer = useRef(null)
  const [layoutSlot] = useState(createSlot)
  const [imageHandlerSlot] = useState(createSlot)

  const editor = useEditor(
    {
      extensions: createExtensions({
        getLayout: layoutSlot.get,
        onPagesChange: (count) => setPages(count),
      }),
      content: doc.content,
      autofocus: 'end',
      immediatelyRender: true,
      shouldRerenderOnTransaction: false,
      editorProps: {
        attributes: { class: 'doc-body', 'aria-label': 'Document body', spellcheck: 'true' },
        // Pasted or dropped pictures become images in the document.
        handlePaste: (_view, event) => {
          const files = [...(event.clipboardData?.files ?? [])].filter(isImageFile)
          if (!files.length) return false
          imageHandlerSlot.get()?.(files)
          return true
        },
        handleDrop: (view, event, _slice, moved) => {
          const files = [...(event.dataTransfer?.files ?? [])].filter(isImageFile)
          if (moved || !files.length) return false
          event.preventDefault()
          imageHandlerSlot.get()?.(files, view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos)
          return true
        },
      },
      onUpdate: ({ editor: current }) => {
        setStatus('Saving…')
        clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => {
          saveTimer.current = null
          saveContent(doc.id, current.getHTML())
          setStatus('Saved')
          setSaves((count) => count + 1)
        }, SAVE_DELAY)
      },
    },
    [doc.id],
  )

  const state = useEditorState({ editor, selector: selectState })

  // The pagination extension reads the current page measurements through this ref.
  useLayoutEffect(() => {
    layoutSlot.set(
      showPages
        ? { contentHeight: layout.contentHeight, marginTop: layout.marginTop, marginBottom: layout.marginBottom, gap: PAGE_GAP }
        : null,
    )
    if (editor && !editor.isDestroyed) editor.commands.repaginate()
  }, [editor, layoutSlot, showPages, layout.contentHeight, layout.marginTop, layout.marginBottom, layout.contentWidth])

  const flushSave = () => {
    if (saveTimer.current) setSaves((count) => count + 1)
    clearTimeout(saveTimer.current)
    saveTimer.current = null
    if (editor && !editor.isDestroyed) saveContent(doc.id, editor.getHTML())
    setStatus('Saved')
  }

  // A sealed document can be read but not changed. No update event, so no save.
  useEffect(() => {
    if (editor && !editor.isDestroyed) editor.setEditable(!sealed, false)
  }, [editor, sealed])

  const seal = () => {
    flushSave()
    sealDocument(doc.id)
    setSealMotion('stamping')
    showToast(`“${title}” is sealed. Break the seal to make changes.`)
  }

  const breakTimer = useRef(null)
  useEffect(() => () => clearTimeout(breakTimer.current), [])
  const unseal = () => {
    setSealMotion('breaking')
    breakTimer.current = setTimeout(
      () => {
        breakSeal(doc.id)
        setSealMotion(null)
        editor?.commands.focus()
      },
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : BREAK_MS,
    )
  }

  // Save any pending edit when leaving the editor.
  const onLeave = useEffectEvent(() => {
    if (saveTimer.current) flushSave()
  })
  useEffect(() => {
    markOpened(doc.id)
    return () => onLeave()
  }, [doc.id])

  const insertImages = async (files, position) => {
    for (const file of files) {
      try {
        const { src, alt, width, height } = await prepareImage(file)
        const content = { type: 'image', attrs: { src, alt, ...fitToWidth({ width, height }, layout.contentWidth) } }
        const chain = editor.chain().focus()
        if (position === undefined) chain.insertContent(content).run()
        else chain.insertContentAt(position, content).run()
      } catch (error) {
        showToast(error.message, { tone: 'error' })
      }
    }
  }

  useLayoutEffect(() => {
    imageHandlerSlot.set(insertImages)
  })

  const commitTitle = () => {
    if (title.trim()) renameDocument(doc.id, title)
    else setTitle(doc.title)
  }

  const download = async (format) => {
    flushSave()
    const isBuilt = ['docx', 'doc', 'pdf'].includes(format)
    if (isBuilt) showToast(`Preparing “${title || 'Untitled'}”…`)
    try {
      await downloadDocument({ title, content: editor.getHTML(), json: editor.getJSON(), layout }, format)
      if (isBuilt) dismissToast()
    } catch (error) {
      console.error(error)
      showToast('That download couldn’t be made. Please try again.', { tone: 'error' })
    }
  }

  const sheetStride = layout.height + PAGE_GAP

  return (
    <div className="editor">
      <title>{`${title || 'Untitled'} – Doan Docs`}</title>
      {/* Printing uses this document's paper size and margins. */}
      <style>{`@page { size: ${layout.printSize}; margin: ${layout.printMargin}; }`}</style>

      <header className="editor-header">
        <a className="header-icon-button" href="#/home" aria-label="Back to library" onClick={flushSave}>
          <Icon name="arrowLeft" />
        </a>
        <a className="editor-logo" href="#/home" aria-label="Doan Docs home" onClick={flushSave}>
          <Logo variant="icon" size={36} />
        </a>
        <div className="editor-title">
          <label className="visually-hidden" htmlFor="doc-title">Document title</label>
          <input
            id="doc-title"
            value={title}
            readOnly={sealed}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={commitTitle}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                event.currentTarget.blur()
                editor?.commands.focus()
              }
            }}
          />
          <span className="save-status" aria-live="polite">
            {status === 'Saved' && <img key={saves} className="save-seal" src={sealArt} alt="" draggable="false" />}
            {status}
          </span>
        </div>
        <div className="editor-header-actions">
          <button
            type="button"
            className={`header-icon-button ${sealed ? 'is-sealed' : ''}`}
            aria-label={sealed ? 'Break the seal' : 'Seal document'}
            title={sealed ? 'Break the seal to edit' : 'Seal: make this document read-only'}
            disabled={sealMotion === 'breaking'}
            onClick={sealed ? unseal : seal}
          >
            <Icon name="seal" />
          </button>
          <button
            type="button"
            className={`header-icon-button ${doc.starred ? 'is-starred' : ''}`}
            aria-label={doc.starred ? 'Unstar' : 'Star'}
            aria-pressed={doc.starred}
            onClick={() => toggleStar(doc.id)}
          >
            <Icon name={doc.starred ? 'starFilled' : 'star'} />
          </button>
          <Menu
            label="Download"
            triggerClassName="button button-gold"
            trigger={
              <>
                <Icon name="download" size={18} />
                <span className="hide-small">Download</span>
              </>
            }
            items={[
              ...EXPORT_FORMATS.map((format) => ({ label: format.label, onSelect: () => download(format.id) })),
              { type: 'divider', key: 'print-divider' },
              { label: 'Print…', icon: <Icon name="printer" size={18} />, onSelect: () => window.print() },
            ]}
          />
        </div>
      </header>

      {sealed && (
        <div className="sealed-bar" role="status">
          <img src={sealArt} alt="" width={28} height={28} draggable="false" />
          <span>
            <strong>Sealed</strong> · {formatWhen(doc.sealedAt)} · Read-only until the seal is broken.
          </span>
          <button type="button" className="button button-gold" onClick={unseal} disabled={sealMotion === 'breaking'}>
            Break seal
          </button>
        </div>
      )}

      {editor && state && !sealed && (
        <div className="editor-bars">
          <EditorToolbar
            editor={editor}
            state={state}
            pageView={showPages}
            canShowPages={fitsWidth}
            onPageViewChange={setPageView}
            onPageSetup={() => setIsPageSetupOpen(true)}
            onInsertImages={(files) => insertImages(files)}
          />
          <ContextBar editor={editor} state={state} contentWidth={layout.contentWidth} />
        </div>
      )}

      <div className="editor-canvas">
        <div
          className={`paper ${showPages ? 'is-paged' : 'is-pageless'}`}
          style={{
            '--page-width': `${layout.width}px`,
            '--page-height': `${layout.height}px`,
            '--margin-top': `${layout.marginTop}px`,
            '--margin-side': `${layout.marginSide}px`,
            '--content-width': `${layout.contentWidth}px`,
            '--content-height': `${layout.contentHeight}px`,
            minHeight: showPages ? `${pages * sheetStride - PAGE_GAP}px` : undefined,
          }}
        >
          {showPages && (
            <div className="sheets" aria-hidden="true">
              {Array.from({ length: pages }, (_, index) => (
                <div key={index} className="sheet" style={{ top: index * sheetStride }}>
                  <span className="sheet-number">{index + 1}</span>
                </div>
              ))}
            </div>
          )}
          <PouncePeek saves={saves} />
          <EditorContent editor={editor} className="paper-content" />
          {sealed && (
            // Two halves of one seal, so breaking it can split it apart.
            <div className={`page-seal ${sealMotion ? `is-${sealMotion}` : ''}`} aria-hidden="true">
              <img className="page-seal-half is-left" src={sealArt} alt="" draggable="false" />
              <img className="page-seal-half is-right" src={sealArt} alt="" draggable="false" />
            </div>
          )}
        </div>
        {showPages && (
          <p className="page-count" aria-live="polite">
            {pages} {pages === 1 ? 'page' : 'pages'}
          </p>
        )}
      </div>

      <PageSetupDialog
        isOpen={isPageSetupOpen}
        page={page}
        onClose={() => setIsPageSetupOpen(false)}
        onApply={(next) => updatePageSetup(doc.id, next)}
      />
    </div>
  )
}

const EditorPage = ({ id }) => {
  const { documents, settings } = useLibrary()
  const doc = documents.find((item) => item.id === id)

  if (!doc || doc.trashedAt) {
    return (
      <div className="editor-missing">
        <title>Not found – Doan Docs</title>
        <EmptyState
          title={doc ? 'This document is in Trash' : 'Document not found'}
          message={doc ? 'Restore it from Trash to keep editing.' : 'It may have been deleted, or it lives in another browser.'}
          action={<a className="button button-gold" href={doc ? '#/trash' : '#/home'}>{doc ? 'Go to Trash' : 'Back to Home'}</a>}
        />
      </div>
    )
  }

  return <Editor key={doc.id} doc={doc} pageViewSetting={settings.pageView !== false} />
}

export default EditorPage
