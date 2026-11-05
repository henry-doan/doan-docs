import { useRef, useState } from 'react'
import { useDismiss } from '../hooks/useDismiss.js'
import { useLibrary } from '../hooks/useLibrary.js'
import { formatWhen } from '../lib/dates.js'
import { markAllNotificationsRead, resetLibrary, setCat, setProfileName, setSeasonal, setShowIntro } from '../lib/documentStore.js'
import { navigate } from '../lib/router.js'
import Dialog from './Dialog.jsx'
import Icon from './Icon.jsx'
import Logo from './Logo.jsx'
import Menu from './Menu.jsx'

const initialsOf = (name) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const Notifications = () => {
  const { notifications } = useLibrary()
  const [isOpen, setIsOpen] = useState(false)
  const root = useRef(null)
  useDismiss(root, isOpen, () => setIsOpen(false))
  const unread = notifications.filter((item) => !item.read).length

  return (
    <div ref={root} className="menu">
      <button
        type="button"
        className="header-icon-button"
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <Icon name="bell" />
        {unread > 0 && <span className="notification-dot" aria-hidden="true" />}
      </button>
      {isOpen && (
        <div className="popover notifications" role="region" aria-label="Notifications">
          <div className="popover-header">
            <h2>Notifications</h2>
            <button type="button" className="text-link" disabled={!unread} onClick={markAllNotificationsRead}>
              Mark all read
            </button>
          </div>
          <ul>
            {notifications.map((item) => (
              <li key={item.id} className={item.read ? '' : 'is-unread'}>
                <p>{item.text}</p>
                <time>{formatWhen(item.at)}</time>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const NameForm = ({ name, onDone }) => {
  const [value, setValue] = useState(name)
  return (
    <form
      className="dialog-form"
      onSubmit={(event) => {
        event.preventDefault()
        setProfileName(value)
        onDone()
      }}
    >
      <label className="field">
        <span>Your name</span>
        <input value={value} autoFocus onChange={(event) => setValue(event.target.value)} />
      </label>
      <div className="dialog-footer">
        <button type="button" className="button button-quiet" onClick={onDone}>Cancel</button>
        <button type="submit" className="button button-gold" disabled={!value.trim()}>Save</button>
      </div>
    </form>
  )
}

const ProfileMenu = () => {
  const { profile, settings } = useLibrary()
  const [dialog, setDialog] = useState(null)
  const close = () => setDialog(null)

  const items = [
    {
      type: 'custom',
      key: 'who',
      content: (
        <div className="profile-summary">
          <strong>{profile.name}</strong>
          <span>{profile.email}</span>
        </div>
      ),
    },
    { type: 'divider', key: 'd1' },
    { label: 'Edit name', icon: <Icon name="user" size={18} />, onSelect: () => setDialog('name') },
    {
      label: settings.showIntro ? 'Turn off the book intro' : 'Turn on the book intro',
      icon: <Icon name="book" size={18} />,
      onSelect: () => setShowIntro(!settings.showIntro),
    },
    { label: 'Replay the book intro', icon: <Icon name="refresh" size={18} />, onSelect: () => navigate('/intro') },
    {
      label: settings.seasonal !== false ? 'Turn off seasonal effects' : 'Turn on seasonal effects',
      icon: <Icon name="leaf" size={18} />,
      onSelect: () => setSeasonal(settings.seasonal === false),
    },
    {
      label: settings.cat !== false ? 'Hide Sir Pounce' : 'Bring back Sir Pounce',
      icon: <Icon name="cat" size={18} />,
      onSelect: () => setCat(settings.cat === false),
    },
    { type: 'divider', key: 'd2' },
    { label: 'Reset sample library', icon: <Icon name="restore" size={18} />, danger: true, onSelect: () => setDialog('reset') },
  ]

  return (
    <>
      <Menu
        label="Account"
        triggerClassName="avatar-button"
        trigger={
          <>
            <span className="avatar" aria-hidden="true">{initialsOf(profile.name)}</span>
            <Icon name="chevronDown" size={16} className="avatar-caret" />
          </>
        }
        items={items}
      />
      <Dialog title="Edit name" isOpen={dialog === 'name'} onClose={close}>
        <NameForm name={profile.name} onDone={close} />
      </Dialog>
      <Dialog
        title="Reset the sample library?"
        isOpen={dialog === 'reset'}
        onClose={close}
        footer={
          <>
            <button type="button" className="button button-quiet" onClick={close}>Cancel</button>
            <button
              type="button"
              className="button button-danger"
              onClick={() => {
                resetLibrary()
                close()
                navigate('/home')
              }}
            >
              Reset
            </button>
          </>
        }
      >
        <p className="dialog-text">
          This replaces every document in this browser with the original samples. Documents you created will be deleted.
        </p>
      </Dialog>
    </>
  )
}

/** Navy bar: menu button (mobile), logo, search, notifications and account. */
const AppHeader = ({ query, onQueryChange, onOpenNav }) => (
  <header className="app-header">
    <button type="button" className="header-icon-button nav-toggle" aria-label="Open navigation" onClick={onOpenNav}>
      <Icon name="menu" />
    </button>
    <a className="header-logo" href="#/home" aria-label="Doan Docs home">
      <Logo variant="compact" />
    </a>
    <span className="header-rule" aria-hidden="true" />
    <search className="header-search">
      <Icon name="search" size={18} />
      <label className="visually-hidden" htmlFor="document-search">Search documents</label>
      <input
        id="document-search"
        type="search"
        placeholder="Search documents"
        value={query}
        autoComplete="off"
        onChange={(event) => onQueryChange(event.target.value)}
      />
    </search>
    <div className="header-actions">
      <Notifications />
      <ProfileMenu />
    </div>
  </header>
)

export default AppHeader
