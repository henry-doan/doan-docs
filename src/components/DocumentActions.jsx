import { useState } from 'react'
import Dialog from './Dialog.jsx'
import Icon from './Icon.jsx'
import Menu from './Menu.jsx'
import {
  deleteForever,
  duplicateDocument,
  moveDocument,
  renameDocument,
  breakSeal,
  restoreDocument,
  sealDocument,
  toggleStar,
  trashDocument,
} from '../lib/documentStore.js'
import { FOLDERS } from '../lib/folders.js'
import { navigate } from '../lib/router.js'
import { showToast } from '../lib/toastStore.js'

const RenameForm = ({ doc, onDone }) => {
  const [title, setTitle] = useState(doc.title)
  return (
    <form
      className="dialog-form"
      onSubmit={(event) => {
        event.preventDefault()
        renameDocument(doc.id, title)
        onDone()
      }}
    >
      <label className="field">
        <span>Name</span>
        <input value={title} autoFocus onFocus={(event) => event.target.select()} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <div className="dialog-footer">
        <button type="button" className="button button-quiet" onClick={onDone}>Cancel</button>
        <button type="submit" className="button button-gold" disabled={!title.trim()}>Rename</button>
      </div>
    </form>
  )
}

const MoveForm = ({ doc, onDone }) => {
  const [folder, setFolder] = useState(doc.folder ?? '')
  return (
    <form
      className="dialog-form"
      onSubmit={(event) => {
        event.preventDefault()
        moveDocument(doc.id, folder || null)
        showToast(`Moved “${doc.title}”.`)
        onDone()
      }}
    >
      <fieldset className="folder-choices">
        <legend className="visually-hidden">Folder</legend>
        {[{ id: '', name: 'My Docs (no folder)', icon: 'file' }, ...FOLDERS].map((option) => (
          <label key={option.id} className="folder-choice">
            <input type="radio" name="folder" value={option.id} checked={folder === option.id} onChange={() => setFolder(option.id)} />
            <Icon name={option.icon} size={18} />
            {option.name}
          </label>
        ))}
      </fieldset>
      <div className="dialog-footer">
        <button type="button" className="button button-quiet" onClick={onDone}>Cancel</button>
        <button type="submit" className="button button-gold">Move</button>
      </div>
    </form>
  )
}

/** The ⋯ menu on a document row, with its Rename, Move and Delete dialogs. */
const DocumentActions = ({ doc }) => {
  const [dialog, setDialog] = useState(null)
  const close = () => setDialog(null)

  const trash = () => {
    trashDocument(doc.id)
    showToast(`“${doc.title}” moved to Trash.`, { actionLabel: 'Undo', onAction: () => restoreDocument(doc.id) })
  }

  const items = doc.trashedAt
    ? [
        { label: 'Restore', icon: <Icon name="restore" size={18} />, onSelect: () => restoreDocument(doc.id) },
        { label: 'Delete forever', icon: <Icon name="trash" size={18} />, danger: true, onSelect: () => setDialog('delete') },
      ]
    : [
        { label: 'Open', icon: <Icon name="open" size={18} />, onSelect: () => navigate(`/doc/${doc.id}`) },
        // A sealed document's title is part of what is sealed.
        !doc.sealedAt && { label: 'Rename', icon: <Icon name="edit" size={18} />, onSelect: () => setDialog('rename') },
        { label: 'Move to folder', icon: <Icon name="move" size={18} />, onSelect: () => setDialog('move') },
        {
          label: 'Duplicate',
          icon: <Icon name="copy" size={18} />,
          onSelect: () => {
            duplicateDocument(doc.id)
            showToast(`Made a copy of “${doc.title}”.`)
          },
        },
        { label: doc.starred ? 'Remove star' : 'Add star', icon: <Icon name="star" size={18} />, onSelect: () => toggleStar(doc.id) },
        doc.sealedAt
          ? { label: 'Break seal', icon: <Icon name="seal" size={18} />, onSelect: () => breakSeal(doc.id) }
          : { label: 'Seal document', icon: <Icon name="seal" size={18} />, onSelect: () => sealDocument(doc.id) },
        { type: 'divider', key: 'divider' },
        { label: 'Move to Trash', icon: <Icon name="trash" size={18} />, danger: true, onSelect: trash },
      ]

  return (
    <>
      <Menu label={`Actions for ${doc.title}`} trigger={<Icon name="more" />} items={items.filter(Boolean)} />
      <Dialog title="Rename document" isOpen={dialog === 'rename'} onClose={close}>
        <RenameForm doc={doc} onDone={close} />
      </Dialog>
      <Dialog title={`Move “${doc.title}”`} isOpen={dialog === 'move'} onClose={close}>
        <MoveForm doc={doc} onDone={close} />
      </Dialog>
      <Dialog
        title="Delete forever?"
        isOpen={dialog === 'delete'}
        onClose={close}
        footer={
          <>
            <button type="button" className="button button-quiet" onClick={close}>Cancel</button>
            <button
              type="button"
              className="button button-danger"
              onClick={() => {
                deleteForever(doc.id)
                close()
              }}
            >
              Delete forever
            </button>
          </>
        }
      >
        <p className="dialog-text">“{doc.title}” will be permanently deleted. This can’t be undone.</p>
      </Dialog>
    </>
  )
}

export default DocumentActions
