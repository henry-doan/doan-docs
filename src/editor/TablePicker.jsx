import { useRef, useState } from 'react'
import { useDismiss } from '../hooks/useDismiss.js'
import Icon from '../components/Icon.jsx'

const MAX = 8

/** Hover over the grid to choose rows × columns, like Word and Google Docs. */
const TablePicker = ({ onInsert }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [size, setSize] = useState({ rows: 3, cols: 3 })
  const root = useRef(null)
  useDismiss(root, isOpen, () => setIsOpen(false))

  const insert = (rows, cols) => {
    setIsOpen(false)
    onInsert(rows, cols)
  }

  return (
    <div ref={root} className="menu">
      <button
        type="button"
        className="tool-button"
        aria-label="Insert table"
        title="Insert table"
        aria-expanded={isOpen}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setIsOpen((current) => !current)}
      >
        <Icon name="table" size={18} />
      </button>
      {isOpen && (
        <div className="popover table-picker" role="dialog" aria-label="Insert table">
          <div
            className="table-grid"
            role="grid"
            style={{ gridTemplateColumns: `repeat(${MAX}, 1fr)` }}
            onKeyDown={(event) => {
              const moves = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }
              if (moves[event.key]) {
                event.preventDefault()
                const [dr, dc] = moves[event.key]
                setSize((current) => ({
                  rows: Math.min(MAX, Math.max(1, current.rows + dr)),
                  cols: Math.min(MAX, Math.max(1, current.cols + dc)),
                }))
              } else if (event.key === 'Enter') {
                event.preventDefault()
                insert(size.rows, size.cols)
              }
            }}
          >
            {Array.from({ length: MAX * MAX }, (_, index) => {
              const row = Math.floor(index / MAX) + 1
              const col = (index % MAX) + 1
              const isOn = row <= size.rows && col <= size.cols
              return (
                <button
                  key={index}
                  type="button"
                  tabIndex={row === 1 && col === 1 ? 0 : -1}
                  className={`table-grid-cell ${isOn ? 'is-on' : ''}`}
                  aria-label={`${row} by ${col} table`}
                  onMouseEnter={() => setSize({ rows: row, cols: col })}
                  onClick={() => insert(row, col)}
                />
              )
            })}
          </div>
          <p className="table-size" aria-live="polite">
            {size.rows} × {size.cols} table
          </p>
          <p className="table-hint">Arrow keys to choose, Enter to insert</p>
        </div>
      )}
    </div>
  )
}

export default TablePicker
