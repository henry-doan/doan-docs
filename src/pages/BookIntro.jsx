import { startTransition, useActionState, useEffect, useRef, useState } from 'react'
import { Quill } from '../components/Illustrations.jsx'
import { DeskAmbience } from '../components/Ambience.jsx'
import Icon from '../components/Icon.jsx'
import { useLibrary } from '../hooks/useLibrary.js'
import { createDocument, setShowIntro, setSound } from '../lib/documentStore.js'
import { IMPORT_ACCEPT, IMPORT_FORMATS_LABEL, importFile } from '../lib/fileImport.js'
import { navigate } from '../lib/router.js'
import { playCoverOpen, playPageTurn } from '../lib/sound.js'
import { getTemplate } from '../lib/templates.js'
import coverArt from '../assets/intro/cover.webp'
import coverBoard from '../assets/intro/cover-board.webp'
import insideArt from '../assets/intro/inside.webp'
import pageBlank from '../assets/intro/page-blank.webp'
import pagePaper from '../assets/intro/page-paper.webp'
import writtenLeft from '../assets/intro/written-left.webp'
import writtenRight from '../assets/intro/written-right.webp'

const ARRIVE_MS = 750
/** The front board starts to turn this long after the book is clicked. */
const COVER_DELAY_MS = 200
/** How long one page takes to turn; matches `.turning-leaf` in styles.css. */
const PAGE_TURN_MS = 650

/**
 * The pages that turn while the work runs, top first. The back of the third
 * and the front of the fourth make a spread carrying the written letter, and
 * the turning pauses there (`hold`) so it can be read.
 */
const TURNING_PAGES = [
  { front: pageBlank, back: pagePaper },
  { front: pagePaper, back: pageBlank },
  { front: pageBlank, back: writtenLeft },
  { front: writtenRight, back: pageBlank, hold: true },
  { front: pagePaper, back: pageBlank },
  { front: pageBlank, back: pagePaper },
]
const HOLD_FROM = TURNING_PAGES.findIndex((page) => page.hold)

/** When each page starts to turn. The animation and its sound both use this. */
const pageDelay = (index) => 140 + index * 110 + (index >= HOLD_FROM ? 600 : 0)
const TURN_MS = pageDelay(TURNING_PAGES.length - 1) + PAGE_TURN_MS + 50

/**
 * One side of a page. The parchment page is cut from the right-hand page of
 * the open book, so on a page's back (the left-hand side) it is mirrored to
 * keep its spine shading next to the spine.
 */
const PageFace = ({ side, art, children }) => (
  <div className={`face ${side}`}>
    <img
      className={`page-art ${side === 'back' && art === pagePaper ? 'is-mirrored' : ''}`}
      src={art}
      alt=""
      draggable="false"
    />
    {children}
  </div>
)

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * The start screen: a closed book on a desk. Opening it shows two choices.
 * Choosing one turns the pages while the document is created or the file is
 * read, then zooms into the blank last page and opens the editor.
 *
 * The work runs as a React 19 action, so `isPending` is exactly "the pages
 * are turning", and a failed import turns the pages back with an error.
 */
const BookIntro = () => {
  const { settings } = useLibrary()
  const [isOpen, setIsOpen] = useState(false)
  const [destination, setDestination] = useState('')
  const fileInput = useRef(null)
  const startButton = useRef(null)
  const soundOn = settings.sound !== false && !prefersReducedMotion()

  const [result, runAction, isPending] = useActionState(async (_previous, request) => {
    try {
      const reduced = prefersReducedMotion()
      const work =
        request.type === 'file' ? importFile(request.file) : Promise.resolve(getTemplate('blank'))
      // Let the pages finish turning even when the work is instant.
      const [doc] = await Promise.all([work, wait(reduced ? 200 : TURN_MS)])
      return { id: createDocument({ title: doc.title, content: doc.content }), error: null }
    } catch (error) {
      return { id: null, error: error.message }
    }
  }, { id: null, error: null })

  const isArriving = Boolean(result.id)
  const isTurning = isPending || isArriving

  useEffect(() => {
    if (!result.id) return
    const timer = setTimeout(
      () => navigate(`/doc/${result.id}`, { replace: true }),
      prefersReducedMotion() ? 150 : ARRIVE_MS,
    )
    return () => clearTimeout(timer)
  }, [result.id])

  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => startButton.current?.focus({ preventScroll: true }), prefersReducedMotion() ? 0 : 1150)
    return () => clearTimeout(timer)
  }, [isOpen])

  const openBook = () => {
    if (soundOn) playCoverOpen(COVER_DELAY_MS)
    setIsOpen(true)
  }

  const turnPages = (request) => {
    if (soundOn) {
      playPageTurn(0)
      TURNING_PAGES.forEach((_, index) => playPageTurn(pageDelay(index)))
    }
    startTransition(() => runAction(request))
  }

  const startNew = () => {
    setDestination('Untitled document')
    turnPages({ type: 'new' })
  }

  const handleFile = (event) => {
    const [file] = event.target.files
    event.target.value = ''
    if (!file) return
    setDestination(file.name)
    turnPages({ type: 'file', file })
  }

  const phase = isArriving ? 'arriving' : isOpen ? 'open' : 'closed'

  return (
    <main className={`intro is-${phase} ${isTurning ? 'is-turning' : ''}`}>
      <title>Doan Docs</title>
      <div className="intro-glow" aria-hidden="true" />

      <div className="intro-corner">
        <button
          type="button"
          className="intro-chip"
          aria-label="Page sounds"
          aria-pressed={settings.sound !== false}
          title={settings.sound !== false ? 'Mute page sounds' : 'Play page sounds'}
          onClick={() => setSound(settings.sound === false)}
        >
          <Icon name={settings.sound !== false ? 'soundOn' : 'soundOff'} size={18} />
        </button>
        <button type="button" className="intro-chip" onClick={() => navigate('/home')}>
          Skip to library
          <Icon name="arrowLeft" size={16} className="flip-x" />
        </button>
      </div>

      <DeskAmbience seasonal={settings.seasonal !== false} />

      {/* All of the artwork shares one 3:2 frame, so the layers line up exactly. */}
      <div className="book" aria-live="polite">
        {/*
          The book, seen flat. Its front board and right-hand pages are a stack
          of leaves that turn over the spine: the board when the book opens,
          the pages while the document is prepared.
        */}
        <div className="book-open">
          <img className="book-art inside-art" src={insideArt} alt="" draggable="false" />

          <div className="book-right">
            {/* The last page: where the document will appear. */}
            <div className="leaf base-leaf" style={{ '--z': 0 }}>
              <PageFace side="front" art={pageBlank}>
                <div className="destination">
                  <p className="destination-label">{isTurning ? 'Opening' : ''}</p>
                  <p className="destination-title">{isTurning ? destination : ''}</p>
                  <span className="destination-progress" aria-hidden="true" />
                </div>
              </PageFace>
            </div>

            {TURNING_PAGES.map((page, index) => (
              <div
                key={index}
                className="leaf turning-leaf"
                style={{ '--i': index, '--delay': `${pageDelay(index)}ms`, '--z': TURNING_PAGES.length - index }}
                aria-hidden="true"
              >
                <PageFace side="front" art={page.front} />
                <PageFace side="back" art={page.back} />
              </div>
            ))}

            {/* The first page: the two choices. */}
            <div className="leaf menu-leaf" style={{ '--z': TURNING_PAGES.length + 1 }} inert={!isOpen || isTurning}>
              <PageFace side="front" art={pagePaper}>
                <div className="menu-page">
                  <Quill size={36} className="menu-quill" />
                  <h1>Begin a new chapter</h1>
                  <p className="menu-lede">Start on a blank page, or open a document from your device.</p>
                  <div className="menu-actions">
                    <button ref={startButton} type="button" className="button button-gold" onClick={startNew}>
                      <Icon name="plus" size={18} />
                      Start new
                    </button>
                    <button type="button" className="button button-navy-outline" onClick={() => fileInput.current.click()}>
                      <Icon name="open" size={18} />
                      Open document
                    </button>
                    <input
                      ref={fileInput}
                      type="file"
                      className="visually-hidden"
                      accept={IMPORT_ACCEPT}
                      tabIndex={-1}
                      onChange={handleFile}
                    />
                  </div>
                  <p className="menu-hint">Opens {IMPORT_FORMATS_LABEL} files</p>
                  {result.error && (
                    <p className="menu-error" role="alert">
                      {result.error}
                    </p>
                  )}
                  <button type="button" className="text-link menu-library" onClick={() => navigate('/home')}>
                    Go to your library
                  </button>
                </div>
              </PageFace>
              <PageFace side="back" art={pagePaper} />
            </div>

            {/* The front board. Its inside lands exactly where the artwork draws it. */}
            <div className="leaf cover-leaf" style={{ '--z': TURNING_PAGES.length + 2 }} aria-hidden="true">
              <div className="face front">
                <img className="page-art" src={coverBoard} alt="" draggable="false" />
              </div>
              <div className="face back">
                <img className="page-art" src={coverBoard} alt="" draggable="false" />
              </div>
            </div>
          </div>
        </div>

        <img className="book-art cover-art" src={coverArt} alt="" draggable="false" />

        <button type="button" className="cover-button" aria-label="Open the book" inert={isOpen} onClick={openBook}>
          <span className="cover-hint">Click to open</span>
        </button>
      </div>

      <label className="intro-remember">
        <input
          type="checkbox"
          checked={!settings.showIntro}
          onChange={(event) => setShowIntro(!event.target.checked)}
        />
        Go straight to my library next time
      </label>
    </main>
  )
}

export default BookIntro
