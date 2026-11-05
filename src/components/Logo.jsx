import emblem from '../assets/emblem.png'

/** Width ÷ height of the emblem artwork, so its box can be sized before it loads. */
const EMBLEM_RATIO = 204 / 320

/**
 * The Doan Docs emblem (shield, page, quill and crown) from the brand
 * artwork in docs/logo-reference.png, cut out onto a transparent background.
 * `size` is its height in pixels.
 */
export const Emblem = ({ size = 40, className = '' }) => (
  <img
    className={`emblem ${className}`}
    src={emblem}
    width={Math.round(size * EMBLEM_RATIO)}
    height={size}
    alt=""
    draggable="false"
  />
)

/** "DOAN DOCS" set in gold serif capitals. */
export const Wordmark = ({ className = '' }) => (
  <span className={`wordmark ${className}`}>Doan Docs</span>
)

/**
 * variant "full": emblem above the wordmark (splash, book cover).
 * variant "compact": small emblem beside the wordmark (header).
 * variant "icon": emblem in a rounded navy square (app icon).
 */
const Logo = ({ variant = 'compact', size }) => {
  if (variant === 'icon') {
    const iconSize = size ?? 48
    return (
      <span className="logo-icon" style={{ width: iconSize, height: iconSize }} role="img" aria-label="Doan Docs">
        <Emblem size={iconSize * 0.78} />
      </span>
    )
  }

  return (
    <span className={`logo logo-${variant}`} role="img" aria-label="Doan Docs">
      <Emblem size={size ?? (variant === 'full' ? 120 : 40)} />
      <Wordmark />
    </span>
  )
}

export default Logo
