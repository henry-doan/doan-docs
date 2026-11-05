import { currentSeason } from '../lib/seasons.js'

/**
 * Things drifting through the air over the desk: dust in the candlelight,
 * and the season's snow, petals, fireflies or leaves (or a holiday's).
 * Purely decorative and hidden from screen readers; styles.css stills it
 * for anyone who prefers reduced motion.
 */

/** Painted leaves, petals and snowflakes, cut from the sheets of the same names in assets/. */
const byName = (files) => Object.keys(files).sort().map((name) => files[name])
const ART = {
  leaves: byName(import.meta.glob('../assets/particles/leaf-*.webp', { eager: true, import: 'default' })),
  petals: byName(import.meta.glob('../assets/particles/petal-*.webp', { eager: true, import: 'default' })),
  snow: byName(import.meta.glob('../assets/particles/snowflake-*.webp', { eager: true, import: 'default' })),
}

/** Particles that fall past the viewer, so they get depth: near ones big, fast and soft. */
const FALLING = new Set(['snow', 'petals', 'leaves', 'confetti', 'hearts'])

/** A small seeded generator, so particles are scattered but the same on every render. */
const randomFrom = (seed) => {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CONFETTI_COLORS = ['#e4c783', '#c9a65b', '#1c3150', '#8f2a20', '#f5f0e6']

const particleStyle = (kind, random) => {
  // 0 is far away, 1 is right in front of the page.
  const depth = random()
  const style = {
    '--x': `${(random() * 100).toFixed(1)}%`,
    '--y': `${(random() * 100).toFixed(1)}%`,
    '--size': (0.6 + random() * 0.8).toFixed(2),
    '--drift': `${Math.round((random() - 0.5) * 160)}px`,
    '--spin': `${Math.round((random() - 0.5) * 900)}deg`,
    // Negative delays start each particle partway through, so nothing arrives in a clump.
    '--delay': `${(-random() * 20).toFixed(1)}s`,
    '--duration': `${(10 + random() * 10).toFixed(1)}s`,
    '--flutter': `${(1.6 + random() * 2.2).toFixed(1)}s`,
  }
  if (FALLING.has(kind)) {
    style['--size'] = (0.45 + depth * 1.05).toFixed(2)
    style['--duration'] = `${(20 - depth * 10).toFixed(1)}s`
    style['--alpha'] = (0.55 + depth * 0.45).toFixed(2)
    style['--blur'] = depth > 0.88 ? '1.2px' : depth < 0.2 ? '0.6px' : '0px'
  }
  if (kind === 'confetti') style['--color'] = CONFETTI_COLORS[Math.floor(random() * CONFETTI_COLORS.length)]
  return style
}

const Particles = ({ kind, count, seed }) => {
  const random = randomFrom(seed)
  return Array.from({ length: count }, (_, index) => {
    const style = particleStyle(kind, random)
    const art = ART[kind]
    return (
      <span key={index} className={`particle particle-${kind}`} style={style}>
        {/* The art tumbles in 3D inside the falling box, so it turns edge-on as it drifts. */}
        {art && <img className="particle-art" src={art[Math.floor(random() * art.length)]} alt="" draggable="false" />}
      </span>
    )
  })
}

/** Dust, plus the season's particles when `seasonal` is on. Fills its positioned parent. */
export const DeskAmbience = ({ seasonal = true }) => {
  const { particles } = currentSeason()
  return (
    <div className="ambience" aria-hidden="true">
      <Particles kind="dust" count={22} seed={11} />
      {seasonal && <Particles kind={particles} count={particles === 'bats' ? 6 : 22} seed={29} />}
    </div>
  )
}

/** A lighter fall of the season's particles over the castle. */
export const CastleWeather = () => {
  const { particles } = currentSeason()
  return (
    <span className="ambience is-castle" aria-hidden="true">
      <Particles kind={particles} count={particles === 'bats' ? 3 : 10} seed={47} />
    </span>
  )
}
