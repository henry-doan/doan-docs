import { useEffect } from 'react'
import { FOLDERS } from '../lib/folders.js'
import Icon from './Icon.jsx'
import { CastleScene } from './Illustrations.jsx'

const NAV_ITEMS = [
  { path: '/home', label: 'Home', icon: 'home' },
  { path: '/recent', label: 'Recent', icon: 'clock' },
  { path: '/starred', label: 'Starred', icon: 'star' },
  { path: '/trash', label: 'Trash', icon: 'trash' },
]

const SidebarNavItem = ({ path, label, icon, count, currentPath, onNavigate }) => {
  const isActive = currentPath === path
  return (
    <li>
      <a
        href={`#${path}`}
        className={`nav-item ${isActive ? 'is-active' : ''}`}
        aria-current={isActive ? 'page' : undefined}
        onClick={onNavigate}
      >
        <Icon name={icon} size={19} />
        <span>{label}</span>
        {count > 0 && <span className="nav-count">{count}</span>}
      </a>
    </li>
  )
}

/**
 * The navy navigation rail. On small screens it becomes a drawer that
 * slides in over the page; Escape or the backdrop closes it.
 */
const Sidebar = ({ currentPath, counts, isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'is-open' : ''}`} aria-hidden="true" onClick={onClose} />
      <nav className={`sidebar ${isOpen ? 'is-open' : ''}`} aria-label="Library">
        <ul className="nav-list">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem key={item.path} {...item} count={counts[item.path]} currentPath={currentPath} onNavigate={onClose} />
          ))}
        </ul>
        <h2 className="nav-heading">Folders</h2>
        <ul className="nav-list">
          {FOLDERS.map((folder) => (
            <SidebarNavItem
              key={folder.id}
              path={`/folder/${folder.id}`}
              label={folder.name}
              icon={folder.icon}
              count={counts[`/folder/${folder.id}`]}
              currentPath={currentPath}
              onNavigate={onClose}
            />
          ))}
        </ul>
        <CastleScene className="sidebar-castle" />
      </nav>
    </>
  )
}

export default Sidebar
