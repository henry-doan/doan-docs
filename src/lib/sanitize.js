/**
 * Keeps imported HTML to plain document formatting. Scripts, styles, frames,
 * forms, event handlers and javascript: links are removed so a hostile file
 * can't run code inside the editor.
 */

const ALLOWED_TAGS = new Set([
  'P', 'BR', 'H1', 'H2', 'H3', 'H4', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'SUB', 'SUP',
  'UL', 'OL', 'LI', 'BLOCKQUOTE', 'PRE', 'CODE', 'A', 'TABLE', 'THEAD', 'TBODY', 'TR',
  'TH', 'TD', 'IMG', 'HR', 'SPAN', 'DIV', 'FONT',
])
const DROP_ENTIRELY = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'MATH'])
const ALLOWED_ATTRIBUTES = new Set(['href', 'src', 'alt', 'colspan', 'rowspan', 'color', 'style', 'data-drop-cap'])
const SAFE_STYLES = /^(color|background-color|text-align|font-weight|font-style|text-decoration)$/

const isSafeUrl = (value, allowDataImage) => {
  const url = value.trim().toLowerCase()
  if (allowDataImage && url.startsWith('data:image/')) return true
  return /^(https?:|mailto:|#|\/)/.test(url)
}

const cleanStyle = (style) =>
  style
    .split(';')
    .map((rule) => rule.trim())
    .filter((rule) => {
      const [property, value = ''] = rule.split(':').map((part) => part.trim().toLowerCase())
      return SAFE_STYLES.test(property) && !value.includes('url(') && !value.includes('expression')
    })
    .join('; ')

const cleanNode = (node) => {
  for (const child of [...node.children]) {
    if (DROP_ENTIRELY.has(child.tagName)) {
      child.remove()
      continue
    }
    cleanNode(child)
    if (!ALLOWED_TAGS.has(child.tagName)) {
      child.replaceWith(...child.childNodes)
      continue
    }
    for (const attribute of [...child.attributes]) {
      const name = attribute.name.toLowerCase()
      if (!ALLOWED_ATTRIBUTES.has(name)) child.removeAttribute(attribute.name)
      else if ((name === 'href' || name === 'src') && !isSafeUrl(attribute.value, name === 'src')) {
        child.removeAttribute(attribute.name)
      } else if (name === 'style') {
        const style = cleanStyle(attribute.value)
        if (style) child.setAttribute('style', style)
        else child.removeAttribute('style')
      }
    }
    if (child.tagName === 'A') child.setAttribute('rel', 'noopener noreferrer')
  }
}

export const sanitizeHtml = (html) => {
  const document = new DOMParser().parseFromString(html, 'text/html')
  cleanNode(document.body)
  return document.body.innerHTML
}

const escapeHtml = (text) =>
  text.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`)

/** Plain text → paragraphs, keeping blank lines as paragraph breaks. */
export const textToHtml = (text) =>
  text
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('')

/** Editor HTML → plain text with paragraph breaks. */
export const htmlToText = (html) => {
  const document = new DOMParser().parseFromString(html, 'text/html')
  document.querySelectorAll('br').forEach((br) => br.replaceWith('\n'))
  document.querySelectorAll('p, h1, h2, h3, h4, li, blockquote, pre, tr').forEach((block) => {
    block.append('\n\n')
  })
  document.querySelectorAll('li').forEach((item) => item.prepend('• '))
  return document.body.textContent.replace(/\n{3,}/g, '\n\n').trim()
}
