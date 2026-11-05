import { useState } from 'react'
import Dialog from '../components/Dialog.jsx'
import Icon from '../components/Icon.jsx'

const BarButton = ({ icon, label, onClick, disabled, isActive, danger }) => (
  <button
    type="button"
    className={`bar-button ${isActive ? 'is-active' : ''} ${danger ? 'is-danger' : ''}`}
    disabled={disabled}
    aria-pressed={isActive === undefined ? undefined : isActive}
    title={label}
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
  >
    <Icon name={icon} size={17} />
    <span>{label}</span>
  </button>
)

const TableTools = ({ editor, state }) => {
  const run = (command) => () => editor.chain().focus()[command]().run()
  return (
    <div className="context-bar" role="toolbar" aria-label="Table">
      <span className="context-label">
        <Icon name="table" size={16} />
        Table
      </span>
      <BarButton icon="rowAbove" label="Row above" onClick={run('addRowBefore')} />
      <BarButton icon="rowBelow" label="Row below" onClick={run('addRowAfter')} />
      <BarButton icon="colLeft" label="Column left" onClick={run('addColumnBefore')} />
      <BarButton icon="colRight" label="Column right" onClick={run('addColumnAfter')} />
      <span className="toolbar-divider" />
      <BarButton icon="rowDelete" label="Delete row" onClick={run('deleteRow')} />
      <BarButton icon="colDelete" label="Delete column" onClick={run('deleteColumn')} />
      <span className="toolbar-divider" />
      <BarButton icon="header" label="Header row" isActive={state.headerRow} onClick={run('toggleHeaderRow')} />
      <BarButton icon="merge" label="Merge cells" disabled={!state.canMerge} onClick={run('mergeCells')} />
      <BarButton icon="split" label="Split cell" disabled={!state.canSplit} onClick={run('splitCell')} />
      <span className="toolbar-divider" />
      <BarButton icon="tableDelete" label="Delete table" danger onClick={run('deleteTable')} />
    </div>
  )
}

const WIDTHS = [
  { label: 'Small', ratio: 0.33 },
  { label: 'Medium', ratio: 0.5 },
  { label: 'Large', ratio: 0.75 },
  { label: 'Full width', ratio: 1 },
]

const ImageTools = ({ editor, state, contentWidth }) => {
  const [isEditingAlt, setIsEditingAlt] = useState(false)
  const [alt, setAlt] = useState('')
  const { width, height, align } = state.image

  const resize = (ratio) => {
    const nextWidth = Math.round(contentWidth * ratio)
    const nextHeight = width && height ? Math.round((height * nextWidth) / width) : null
    editor.chain().focus().updateAttributes('image', { width: nextWidth, height: nextHeight }).run()
    // The resizable image view only reads its size when created, so show the new size now.
    const dom = editor.view.nodeDOM(editor.state.selection.from)
    const img = dom instanceof HTMLImageElement ? dom : dom?.querySelector?.('img')
    if (img) {
      img.style.width = `${nextWidth}px`
      img.style.height = nextHeight ? `${nextHeight}px` : ''
    }
  }

  return (
    <div className="context-bar" role="toolbar" aria-label="Image">
      <span className="context-label">
        <Icon name="image" size={16} />
        Image
      </span>
      {WIDTHS.map((option) => (
        <BarButton
          key={option.label}
          icon="image"
          label={option.label}
          isActive={Math.abs((width ?? 0) - contentWidth * option.ratio) < 2}
          onClick={() => resize(option.ratio)}
        />
      ))}
      <span className="toolbar-divider" />
      {['left', 'center', 'right'].map((side) => (
        <BarButton
          key={side}
          icon={`align${side[0].toUpperCase()}${side.slice(1)}`}
          label={`Align ${side}`}
          isActive={align === side}
          onClick={() => editor.chain().focus().updateAttributes('image', { align: side }).run()}
        />
      ))}
      <span className="toolbar-divider" />
      <BarButton
        icon="altText"
        label="Alt text"
        onClick={() => {
          setAlt(state.image.alt ?? '')
          setIsEditingAlt(true)
        }}
      />
      <BarButton icon="trash" label="Remove" danger onClick={() => editor.chain().focus().deleteSelection().run()} />

      <Dialog title="Alt text" isOpen={isEditingAlt} onClose={() => setIsEditingAlt(false)}>
        <form
          className="dialog-form"
          onSubmit={(event) => {
            event.preventDefault()
            editor.chain().focus().updateAttributes('image', { alt: alt.trim() }).run()
            setIsEditingAlt(false)
          }}
        >
          <label className="field">
            <span>Describe this image for people who can’t see it</span>
            <input value={alt} autoFocus onChange={(event) => setAlt(event.target.value)} />
          </label>
          <div className="dialog-footer">
            <button type="button" className="button button-quiet" onClick={() => setIsEditingAlt(false)}>Cancel</button>
            <button type="submit" className="button button-gold">Save</button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}

/** Extra tools that appear while the cursor is in a table or an image is selected. */
const ContextBar = ({ editor, state, contentWidth }) => {
  if (state.image) return <ImageTools editor={editor} state={state} contentWidth={contentWidth} />
  if (state.inTable) return <TableTools editor={editor} state={state} />
  return null
}

export default ContextBar
