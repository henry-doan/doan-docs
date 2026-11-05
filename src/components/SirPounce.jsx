import { useEffect, useId, useRef, useState } from 'react'
import { useLibrary } from '../hooks/useLibrary.js'
import { playPurr } from '../lib/sound.js'

/**
 * Sir Pounce, Keeper of the Archive: a navy-and-gold cat who sleeps on top of
 * the bookcase. He breathes, flicks his tail, wakes now and then to yawn and
 * watch the quill, purrs when petted, and every few minutes paws at the shelf
 * so a book wobbles. In the editor, his head peeks over the page when it saves.
 *
 * He is drawn in SVG with each part in its own group so the parts can move
 * separately; the animations live in styles.css under "Sir Pounce".
 */

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const between = (min, max) => min + Math.random() * (max - min)

/** Where his eyes are in the drawing, for aiming his pupils at the pointer. */
const EYES = { x: 93.5, y: 40.5 }

/** His head: ears, face, eyes in every mood, collar. Shared by the cat and the editor peek. */
const Head = ({ fur }) => (
  <g className="pounce-head">
    <path className="pounce-ear is-left" d="M80 36 L82 19 L92 29 Z" fill={fur} />
    <path className="pounce-ear is-right" d="M95 28 L104 17 L107 35 Z" fill={fur} />
    <path d="M83 31 L84 23 L89 29 Z M98 28 L103 22 L104 31 Z" fill="#c9a65b" opacity="0.7" />
    <ellipse cx="93" cy="41" rx="15" ry="13" fill={fur} stroke="#c9a65b" strokeWidth="0.8" />

    <g className="pounce-eyes-closed" fill="none" stroke="#e4c783" strokeWidth="1.3" strokeLinecap="round">
      <path d="M84 41 q3.5 2.6 7 0" />
      <path d="M96 41 q3.5 2.6 7 0" />
    </g>
    <g className="pounce-eyes-happy" fill="none" stroke="#e4c783" strokeWidth="1.4" strokeLinecap="round">
      <path d="M84 42 q3.5 -3.2 7 0" />
      <path d="M96 42 q3.5 -3.2 7 0" />
    </g>
    <g className="pounce-eyes-open">
      <ellipse cx="87.5" cy="40.5" rx="3" ry="3.4" fill="#e4c783" />
      <ellipse cx="99.5" cy="40.5" rx="3" ry="3.4" fill="#e4c783" />
      <g className="pounce-pupils" fill="#0b1220">
        <ellipse cx="87.5" cy="40.5" rx="1" ry="2.6" />
        <ellipse cx="99.5" cy="40.5" rx="1" ry="2.6" />
      </g>
    </g>

    <path d="M91.6 45.6 h2.8 l-1.4 1.7z" fill="#c9a65b" />
    <ellipse className="pounce-yawn" cx="93" cy="50" rx="2.4" ry="2.8" fill="#5a1d24" />
    <g stroke="#e4c783" strokeWidth="0.5" opacity="0.55">
      <path d="M86 47 L74 45 M86 48.5 L74 50" />
      <path d="M100 47 L112 45 M100 48.5 L112 50" />
    </g>
    <path d="M81 51 Q93 58 105 51" fill="none" stroke="#c9a65b" strokeWidth="2" />
    <circle cx="93" cy="55.5" r="2.2" fill="#e4c783" />
  </g>
)

/** The fur's gradient. Its id is unique per drawing so two cats never share one. */
const Fur = ({ id }) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#2a4673" />
      <stop offset="1" stopColor="#101e35" />
    </linearGradient>
  </defs>
)

/** The cat on the bookcase. Renders nothing when he has been hidden. */
const SirPounce = () => {
  const { settings } = useLibrary()
  const furId = useId()
  const art = useRef(null)
  const [mood, setMood] = useState('asleep')
  const awake = mood === 'awake' || mood === 'swiping'

  // Sleep, wake with a yawn, look around, sleep again; purring and swiping settle back to awake.
  useEffect(() => {
    if (reducedMotion() && mood === 'asleep') return
    const next = {
      asleep: ['waking', between(30_000, 60_000)],
      waking: ['awake', 1400],
      awake: ['asleep', 5000],
      purring: ['awake', 2600],
      swiping: ['awake', 900],
    }[mood]
    const timer = setTimeout(() => setMood(next[0]), next[1])
    return () => clearTimeout(timer)
  }, [mood])

  // Mischief every few minutes: a paw at the shelf, and the nearest book wobbles.
  useEffect(() => {
    if (reducedMotion()) return
    let timer
    const plan = () => {
      timer = setTimeout(() => {
        // Never while someone is reaching for a book.
        if (!document.querySelector('.shelf-book:hover, .shelf-book:focus-within')) {
          setMood('swiping')
          const book = document.querySelector('.shelf-book')
          book?.classList.add('is-wobbling')
          setTimeout(() => book?.classList.remove('is-wobbling'), 800)
        }
        plan()
      }, between(120_000, 300_000))
    }
    plan()
    return () => clearTimeout(timer)
  }, [])

  // While awake, his pupils follow the quill.
  useEffect(() => {
    if (!awake) return
    const look = (event) => {
      const svg = art.current
      if (!svg) return
      const box = svg.getBoundingClientRect()
      const x = ((event.clientX - box.left) / box.width) * 120 - EYES.x
      const y = ((event.clientY - box.top) / box.height) * 72 - EYES.y
      const distance = Math.hypot(x, y) || 1
      const reach = Math.min(1, distance / 30)
      svg.style.setProperty('--look-x', ((x / distance) * reach * 1.6).toFixed(2))
      svg.style.setProperty('--look-y', ((y / distance) * reach * 0.9).toFixed(2))
    }
    window.addEventListener('pointermove', look)
    return () => window.removeEventListener('pointermove', look)
  }, [awake])

  if (settings.cat === false) return null

  const pet = () => {
    if (settings.sound !== false && !reducedMotion()) playPurr()
    setMood('purring')
  }

  const fur = `url(#${furId})`
  return (
    <button type="button" className="sir-pounce" data-mood={mood} aria-label="Sir Pounce, Keeper of the Archive. Pet him." onClick={pet}>
      <svg ref={art} className="pounce-art" viewBox="0 0 120 72" aria-hidden="true" focusable="false">
        <Fur id={furId} />
        <g className="pounce-tail">
          <path d="M24 66 C6 68 2 54 10 47 C14 44 19 46 18 51" fill="none" stroke={fur} strokeWidth="7" strokeLinecap="round" />
          <path d="M18 51 C19 46 14 44 10 47" fill="none" stroke="#c9a65b" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        </g>
        <path className="pounce-body" d="M16 69 C12 50 30 37 56 37 C80 37 95 47 97 69 Z" fill={fur} stroke="#c9a65b" strokeWidth="0.8" />
        <ellipse cx="80" cy="67" rx="7" ry="3.6" fill={fur} stroke="#c9a65b" strokeWidth="0.6" />
        <ellipse className="pounce-paw" cx="92" cy="67" rx="7" ry="3.6" fill={fur} stroke="#c9a65b" strokeWidth="0.6" />
        <Head fur={fur} />
      </svg>
      {mood === 'purring' && (
        <span className="pounce-hearts" aria-hidden="true">
          <span>♥</span>
          <span>♥</span>
          <span>♥</span>
        </span>
      )}
      <span className="pounce-card" aria-hidden="true">
        <strong>Sir Pounce</strong>
        Keeper of the Archive
      </span>
    </button>
  )
}

/** In the editor: his head peeks over the top of the page when it saves, at most once a minute. */
export const PouncePeek = ({ saves }) => {
  const { settings } = useLibrary()
  const furId = useId()
  const lastPeek = useRef(0)
  const [peeking, setPeeking] = useState(false)

  useEffect(() => {
    if (saves === 0 || settings.cat === false || reducedMotion()) return
    if (Date.now() - lastPeek.current < 60_000) return
    lastPeek.current = Date.now()
    const up = setTimeout(() => setPeeking(true), 0)
    const down = setTimeout(() => setPeeking(false), 2400)
    return () => {
      clearTimeout(up)
      clearTimeout(down)
    }
  }, [saves, settings.cat])

  if (settings.cat === false) return null
  return (
    <div className={`pounce-peek ${peeking ? 'is-peeking' : ''}`} aria-hidden="true">
      <svg viewBox="74 14 38 46" data-mood="awake">
        <Fur id={furId} />
        <Head fur={`url(#${furId})`} />
      </svg>
    </div>
  )
}

export default SirPounce
