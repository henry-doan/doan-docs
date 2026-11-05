/**
 * A small blot of ink where the quill clicks: a splash with a few droplets,
 * turned at random, that soaks in and fades. Purely decorative, so it skips
 * touch (no quill there) and anyone who prefers reduced motion.
 */

const INK = '#0b1a2e'

const blot = () => {
  const drops = Array.from({ length: 4 + Math.floor(Math.random() * 3) }, () => {
    const angle = Math.random() * Math.PI * 2
    const distance = 8 + Math.random() * 9
    const radius = 0.8 + Math.random() * 1.6
    return `<circle cx="${(Math.cos(angle) * distance).toFixed(1)}" cy="${(Math.sin(angle) * distance).toFixed(1)}" r="${radius.toFixed(1)}"/>`
  })
  return (
    `<svg viewBox="-20 -20 40 40" width="40" height="40" fill="${INK}" aria-hidden="true">` +
    '<path d="M-1-7c3-1 5 1 7 0s4 3 2 6 1 5-2 7-5 2-7 0-6-1-5-4-1-5 0-7 3-1 5-2z"/>' +
    drops.join('') +
    '</svg>'
  )
}

export const installInkSplash = () => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  document.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch' || event.button !== 0 || reduced.matches) return
    const splash = document.createElement('span')
    splash.className = 'ink-splash'
    splash.style.left = `${event.clientX}px`
    splash.style.top = `${event.clientY}px`
    splash.style.setProperty('--spin', `${Math.round(Math.random() * 360)}deg`)
    splash.innerHTML = blot()
    splash.addEventListener('animationend', () => splash.remove())
    document.body.append(splash)
  })
}
