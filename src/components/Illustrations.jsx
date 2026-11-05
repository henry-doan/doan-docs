import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import castleLarge from '../assets/castle-large.webp'
import castle from '../assets/castle.webp'
import { useLibrary } from '../hooks/useLibrary.js'
import { playWhoosh } from '../lib/sound.js'
import { CastleWeather } from './Ambience.jsx'
import flagLeft from '../assets/castle-flag-left.webp'
import flagMain from '../assets/castle-flag-main.webp'
import flagRight from '../assets/castle-flag-right.webp'
import quill from '../assets/quill.webp'

/**
 * The castle and the quill. The quill is decoration; the castle is also a
 * secret door to the kingdom of Excelsior.
 */

/** Width ÷ height of the artwork, so each box can be sized before it loads. */
const CASTLE_RATIO = 1000 / 322
const QUILL_RATIO = 256 / 247

/**
 * The castle's flags, cut out of the artwork so they can wave. Positions are
 * percentages of the 1000 × 322 castle; each flag hinges on its pole (left edge).
 */
const FLAGS = [
  { src: flagMain, left: 79.2, top: 2.8, width: 7.2, height: 13.66, delay: 0 },
  { src: flagLeft, left: 69.3, top: 27.33, width: 2.4, height: 4.97, delay: -0.7 },
  { src: flagRight, left: 85, top: 29.81, width: 2.8, height: 5.59, delay: -1.3 },
]

/** Where the secret door leads. */
const EXCELSIOR_URL = 'https://doan-excelsior.netlify.app/'
/** How long the journey plays before the browser goes there. */
const JOURNEY_MS = 4400
/** Where the castle's keep sits across the artwork (0 to 1); it stays in view as the castle grows. */
const KEEP_X = 0.8

/** The castle on its hill above the lake, framed by a gold bar, its flags waving. */
const CastleArt = ({ weather, large }) => (
  <span className="castle-art">
    <img src={castle} width={1000} height={Math.round(1000 / CASTLE_RATIO)} alt="" draggable="false" />
    {/* A sharper copy for the full-screen journey; it shows once it has loaded. */}
    {large && <img className="castle-large" src={castleLarge} alt="" draggable="false" />}
    {FLAGS.map((flag) => (
      <img
        key={flag.src}
        className="castle-flag"
        src={flag.src}
        alt=""
        draggable="false"
        style={{
          left: `${flag.left}%`,
          top: `${flag.top}%`,
          width: `${flag.width}%`,
          height: `${flag.height}%`,
          animationDelay: `${flag.delay}s`,
        }}
      />
    ))}
    {weather && <CastleWeather />}
  </span>
)

/**
 * The castle grows from where it was clicked until it fills the screen,
 * a night sky fades in behind it, and "To Excelsior…" appears.
 */
const Journey = ({ from, to }) => {
  const [arrived, setArrived] = useState(false)

  useEffect(() => {
    // Two frames, so the castle is painted at its starting place before it moves.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setArrived(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  const box = arrived ? to : from
  return createPortal(
    <div className={`journey ${arrived ? 'is-arrived' : ''}`} role="status">
      <div className="journey-castle" style={{ left: box.left, top: box.top, width: box.width, height: box.height }}>
        <CastleArt large />
      </div>
      <p className="journey-title">To Excelsior…</p>
    </div>,
    document.body,
  )
}

/**
 * The castle, as a link to Excelsior. A plain click plays the journey first;
 * a middle-click or Ctrl+click opens the site in a new tab as links do.
 */
export const CastleScene = ({ className = '' }) => {
  const { settings } = useLibrary()
  const [journey, setJourney] = useState(null)

  useEffect(() => {
    if (!journey) return
    const timer = setTimeout(() => window.location.assign(EXCELSIOR_URL), JOURNEY_MS)
    return () => clearTimeout(timer)
  }, [journey])

  // Coming back with the Back button can restore this page as it was left: mid-journey.
  useEffect(() => {
    const reset = (event) => event.persisted && setJourney(null)
    window.addEventListener('pageshow', reset)
    return () => window.removeEventListener('pageshow', reset)
  }, [])

  const travel = (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    // Without motion the link just goes, like any other.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    event.preventDefault()
    if (journey) return
    if (settings.sound !== false) playWhoosh()

    const start = event.currentTarget.querySelector('.castle-art').getBoundingClientRect()
    const viewWidth = window.innerWidth
    const viewHeight = window.innerHeight
    // Cover the screen, resting on its bottom edge, with the keep as near the middle as the edges allow.
    const width = Math.max(viewWidth, viewHeight * CASTLE_RATIO)
    const height = width / CASTLE_RATIO
    const left = Math.min(0, Math.max(viewWidth - width, viewWidth / 2 - KEEP_X * width))
    setJourney({
      from: { left: start.left, top: start.top, width: start.width, height: start.height },
      to: { left, top: viewHeight - height, width, height },
    })
  }

  return (
    <>
      <a className={`castle-scene ${className}`} href={EXCELSIOR_URL} aria-label="A distant kingdom: visit Excelsior" onClick={travel}>
        <CastleArt weather={settings.seasonal !== false} />
        <span className="castle-hint" aria-hidden="true">A distant kingdom…</span>
      </a>
      {journey && <Journey {...journey} />}
    </>
  )
}

/** The gold quill. `size` is its height in pixels. */
export const Quill = ({ className = '', size = 40 }) => (
  <img
    className={`quill ${className}`}
    src={quill}
    width={Math.round(size * QUILL_RATIO)}
    height={size}
    alt=""
    draggable="false"
  />
)
