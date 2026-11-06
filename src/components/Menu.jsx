import { useLayoutEffect, useRef, useState } from 'react'
import { useDismiss } from '../hooks/useDismiss.js'

/** The area a menu has to fit in: the window, cut down by any ancestor that clips what spills out of it. */
const visibleBounds = (element) => {
  const bounds = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight }
  for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(parent)
    const box = parent.getBoundingClientRect()
    if (overflowX !== 'visible') {
      bounds.left = Math.max(bounds.left, box.left)
      bounds.right = Math.min(bounds.right, box.right)
    }
    if (overflowY !== 'visible') {
      bounds.top = Math.max(bounds.top, box.top)
      bounds.bottom = Math.min(bounds.bottom, box.bottom)
    }
  }
  return bounds
}

/**
 * A button that opens a list of actions. Arrow keys move between items,
 * Escape or a click outside closes it.
 */
const Menu = ({ label, trigger, triggerClassName = 'icon-button', items, align = 'end', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const root = useRef(null)
  const list = useRef(null)
  // Where the list opens: it flips to the other side, or above the button, when it wouldn't fit.
  const [placement, setPlacement] = useState({ align, above: false })
  useDismiss(root, isOpen, () => setIsOpen(false))

  useLayoutEffect(() => {
    if (!isOpen || !list.current) return
    const bounds = visibleBounds(root.current)
    const button = root.current.getBoundingClientRect()
    const { width, height } = list.current.getBoundingClientRect()
    const fitsEnd = button.right - width >= bounds.left
    const fitsStart = button.left + width <= bounds.right
    const nextAlign = align === 'end' ? (fitsEnd || !fitsStart ? 'end' : 'start') : (fitsStart || !fitsEnd ? 'start' : 'end')
    const roomBelow = bounds.bottom - button.bottom
    const roomAbove = button.top - bounds.top
    const above = height + 6 > roomBelow && roomAbove > roomBelow
    setPlacement((current) => (current.align === nextAlign && current.above === above ? current : { align: nextAlign, above }))
  }, [isOpen, align])

  const focusItem = (step) => {
    const buttons = [...list.current.querySelectorAll('[role="menuitem"]:not(:disabled)')]
    const index = buttons.indexOf(document.activeElement)
    buttons.at((index + step) % buttons.length)?.focus()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusItem(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusItem(-1)
    } else if (event.key === 'Escape') {
      setIsOpen(false)
      root.current.querySelector('button').focus()
    }
  }

  const open = (event) => {
    event.stopPropagation()
    if (!isOpen) setPlacement({ align, above: false })
    setIsOpen((current) => !current)
    requestAnimationFrame(() => list.current?.querySelector('[role="menuitem"]')?.focus())
  }

  return (
    <div ref={root} className={`menu ${className}`} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        className={triggerClassName}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={open}
      >
        {trigger}
      </button>
      {isOpen && (
        <div ref={list} className={`menu-list align-${placement.align} ${placement.above ? 'is-above' : ''}`} role="menu" aria-label={label} onKeyDown={handleKeyDown}>
          {items.map((item) =>
            item.type === 'divider' ? (
              <hr key={item.key} className="menu-divider" />
            ) : item.type === 'custom' ? (
              <div key={item.key} className="menu-custom">{item.content}</div>
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={`menu-item ${item.danger ? 'is-danger' : ''}`}
                disabled={item.disabled}
                onClick={(event) => {
                  setIsOpen(false)
                  item.onSelect(event)
                }}
              >
                {item.icon && item.icon}
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}

export default Menu
