import { useRef } from 'react'
import Icon from '../components/Icon.jsx'
import { IMAGE_ACCEPT } from './images.js'
import TablePicker from './TablePicker.jsx'

const BLOCK_STYLES = [
  { value: 'paragraph', label: 'Normal text' },
  { value: 'h1', label: 'Title' },
  { value: 'h2', label: 'Heading 1' },
  { value: 'h3', label: 'Heading 2' },
  { value: 'quote', label: 'Quote' },
]

const applyBlockStyle = (editor, value) => {
  const chain = editor.chain().focus()
  if (value === 'paragraph') chain.setParagraph().run()
  else if (value === 'quote') chain.setParagraph().toggleBlockquote().run()
  else chain.setHeading({ level: Number(value.slice(1)) }).run()
}

const ToolButton = ({ icon, label, shortcut, isActive, disabled, onClick }) => (
  <button
    type="button"
    className={`tool-button ${isActive ? 'is-active' : ''}`}
    aria-label={label}
    aria-pressed={isActive === undefined ? undefined : isActive}
    title={shortcut ? `${label} (${shortcut})` : label}
    disabled={disabled}
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
  >
    <Icon name={icon} size={18} />
  </button>
)

/** Formatting, insert and view controls above the page. */
const EditorToolbar = ({ editor, state, pageView, canShowPages, onPageViewChange, onPageSetup, onInsertImages }) => {
  const imageInput = useRef(null)
  const chain = () => editor.chain().focus()

  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Formatting">
      <ToolButton icon="undo" label="Undo" shortcut="Ctrl+Z" disabled={!state.canUndo} onClick={() => chain().undo().run()} />
      <ToolButton icon="redo" label="Redo" shortcut="Ctrl+Y" disabled={!state.canRedo} onClick={() => chain().redo().run()} />
      <span className="toolbar-divider" />

      <label className="visually-hidden" htmlFor="block-style">Text style</label>
      <select
        id="block-style"
        className="style-select"
        value={state.block}
        onChange={(event) => applyBlockStyle(editor, event.target.value)}
      >
        {BLOCK_STYLES.map((style) => (
          <option key={style.value} value={style.value}>{style.label}</option>
        ))}
      </select>
      <span className="toolbar-divider" />

      <ToolButton icon="bold" label="Bold" shortcut="Ctrl+B" isActive={state.bold} onClick={() => chain().toggleBold().run()} />
      <ToolButton icon="italic" label="Italic" shortcut="Ctrl+I" isActive={state.italic} onClick={() => chain().toggleItalic().run()} />
      <ToolButton icon="underline" label="Underline" shortcut="Ctrl+U" isActive={state.underline} onClick={() => chain().toggleUnderline().run()} />
      <ToolButton icon="strike" label="Strikethrough" isActive={state.strike} onClick={() => chain().toggleStrike().run()} />
      <label className="color-tool" title="Text color">
        <span className="visually-hidden">Text color</span>
        <span className="color-letter" aria-hidden="true" style={{ borderBottomColor: state.color ?? undefined }}>A</span>
        <input type="color" value={state.color ?? '#252b35'} onChange={(event) => chain().setColor(event.target.value).run()} />
      </label>
      <span className="toolbar-divider" />

      <ToolButton
        icon="dropCap"
        label="Illuminated first letter"
        isActive={state.dropCap}
        disabled={!state.inParagraph}
        onClick={() => chain().updateAttributes('paragraph', { dropCap: !state.dropCap }).run()}
      />
      <span className="toolbar-divider" />

      <ToolButton icon="listBullet" label="Bulleted list" isActive={state.bulletList} onClick={() => chain().toggleBulletList().run()} />
      <ToolButton icon="listNumber" label="Numbered list" isActive={state.orderedList} onClick={() => chain().toggleOrderedList().run()} />
      <span className="toolbar-divider" />

      {['left', 'center', 'right'].map((side) => (
        <ToolButton
          key={side}
          icon={`align${side[0].toUpperCase()}${side.slice(1)}`}
          label={`Align ${side}`}
          isActive={state.align === side}
          onClick={() => chain().setTextAlign(side).run()}
        />
      ))}
      <span className="toolbar-divider" />

      <TablePicker onInsert={(rows, cols) => chain().insertTable({ rows, cols, withHeaderRow: true }).run()} />
      <ToolButton icon="image" label="Insert image" onClick={() => imageInput.current.click()} />
      <input
        ref={imageInput}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const files = [...event.target.files]
          event.target.value = ''
          if (files.length) onInsertImages(files)
        }}
      />
      <ToolButton icon="eraser" label="Clear formatting" onClick={() => chain().unsetAllMarks().unsetTextAlign().run()} />

      <div className="toolbar-end">
        <ToolButton icon="pageSetup" label="Page setup" onClick={onPageSetup} />
        <div className="view-switch" role="radiogroup" aria-label="Page view">
          <button
            type="button"
            role="radio"
            aria-checked={pageView}
            disabled={!canShowPages}
            title={canShowPages ? 'Show pages' : 'Pages need a wider window'}
            onClick={() => onPageViewChange(true)}
          >
            <Icon name="pages" size={16} />
            <span>Pages</span>
          </button>
          <button type="button" role="radio" aria-checked={!pageView} title="One continuous page" onClick={() => onPageViewChange(false)}>
            <Icon name="pageless" size={16} />
            <span>Pageless</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditorToolbar
