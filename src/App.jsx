import { useEffect } from 'react'
import AppShell from './components/AppShell.jsx'
import EmptyState from './components/EmptyState.jsx'
import Toast from './components/Toast.jsx'
import { useLibrary } from './hooks/useLibrary.js'
import { useRoute } from './hooks/useRoute.js'
import { navigate } from './lib/router.js'
import BookIntro from './pages/BookIntro.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import EditorPage from './pages/EditorPage.jsx'
import ListPage from './pages/ListPage.jsx'
import TemplateGallery from './pages/TemplateGallery.jsx'

const LIST_VIEWS = new Set(['recent', 'starred', 'trash', 'folder'])

const ShellPage = ({ route, query }) => {
  if (route.name === 'home') return <DashboardPage query={query} />
  if (route.name === 'templates') return <TemplateGallery />
  if (LIST_VIEWS.has(route.name)) return <ListPage view={route.name} folderId={route.params?.folder} query={query} />
  return (
    <EmptyState
      title="Page not found"
      message="That page doesn’t exist."
      action={<a className="button button-gold" href="#/home">Back to Home</a>}
    />
  )
}

const App = () => {
  const route = useRoute()
  const { settings } = useLibrary()
  const showIntro = route.name === 'intro' || (route.name === 'start' && settings.showIntro)

  // Launching with the intro turned off goes straight to the library.
  useEffect(() => {
    if (route.name === 'start' && !settings.showIntro) navigate('/home', { replace: true })
  }, [route.name, settings.showIntro])

  let page
  if (showIntro) page = <BookIntro />
  else if (route.name === 'doc') page = <EditorPage id={route.params.id} />
  else if (route.name === 'start') page = null
  else {
    page = (
      <AppShell currentPath={route.path}>
        {(query) => <ShellPage route={route} query={query} />}
      </AppShell>
    )
  }

  return (
    <>
      {page}
      <Toast />
    </>
  )
}

export default App
