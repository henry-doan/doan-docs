/**
 * Builds a Word 97–2003 (.doc) file. It's a Word web archive: the document as
 * Word-flavored HTML, with its pictures packed alongside, which Word, LibreOffice
 * and Pages all open as a .doc. Unlike a .docx it needs no library.
 */

import { exportImage } from './exportImages.js'

const BOUNDARY = '----=_DoanDocs_Part_0001'

const escapeHtml = (text) => text.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char])

/** Base64 for UTF-8 text, in the 76-character lines MIME expects. */
const base64Lines = (base64) => base64.replace(/.{1,76}/g, '$&\r\n')
const utf8Base64 = (text) => {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  return btoa(binary)
}

const DOC_STYLE = (layout) => `
@page Section1 { size: ${layout.width * 0.75}pt ${layout.height * 0.75}pt; margin: ${layout.marginTop * 0.75}pt ${layout.marginSide * 0.75}pt;${layout.width > layout.height ? ' mso-page-orientation: landscape;' : ''} }
div.Section1 { page: Section1; }
body { font-family: Georgia, serif; font-size: 13.5pt; line-height: 1.4; color: #252B35; }
p { margin: 0 0 9pt; }
h1 { font-size: 27pt; color: #14243B; margin: 0 0 8pt; }
h2 { font-size: 19.5pt; color: #14243B; margin: 12pt 0 6pt; }
h3 { font-size: 16pt; margin: 10pt 0 5pt; }
blockquote { margin: 0 0 9pt; padding-left: 12pt; border-left: 2.25pt solid #C9A65B; color: #5B6576; font-style: italic; }
a { color: #1F4E9A; }
table { border-collapse: collapse; margin-bottom: 12pt; }
td, th { border: 0.75pt solid #D8D2C4; padding: 4pt 6pt; vertical-align: top; }
th { background: #F5F0E6; }
pre { background: #F1EDE4; padding: 6pt; font-family: "Courier New", monospace; font-size: 10.5pt; }
hr { border: 0; border-top: 0.75pt solid #C9A65B; }
`

/** Returns the .doc file as a Blob. */
export const buildDoc = async ({ title, content, layout }) => {
  const page = new DOMParser().parseFromString(`<div>${content}</div>`, 'text/html').body.firstElementChild

  // Word doesn't draw ::first-letter, so the illuminated capital becomes a styled letter.
  for (const paragraph of page.querySelectorAll('p[data-drop-cap]')) {
    const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT)
    let textNode = walker.nextNode()
    while (textNode && !textNode.data.trim()) textNode = walker.nextNode()
    if (!textNode) continue
    const offset = textNode.data.search(/\S/)
    const [letter] = textNode.data.slice(offset)
    const cap = document.createElement('span')
    cap.setAttribute('style', 'font-size:36pt;font-weight:bold;color:#E4C783;background:#14243B;padding:0 4pt;')
    cap.textContent = letter
    const rest = textNode.splitText(offset)
    rest.data = rest.data.slice(letter.length)
    rest.before(cap)
  }

  // Pictures stored in the document travel as parts of the archive.
  const parts = []
  for (const image of page.querySelectorAll('img')) {
    // Word shows PNG, JPEG and GIF; WebP and others are redrawn as PNG.
    const picture = await exportImage({ src: image.getAttribute('src') }, ['png', 'jpg', 'gif'])
    if (picture) image.setAttribute('src', picture.dataUrl)
    const match = image.getAttribute('src')?.match(/^data:(image\/[a-z+.-]+);base64,(.*)$/is)
    if (match) {
      const extension = match[1].split('/')[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg')
      const name = `image${String(parts.length + 1).padStart(3, '0')}.${extension}`
      parts.push({ name, type: match[1], data: match[2] })
      image.setAttribute('src', name)
    }
    const width = Number(image.getAttribute('width'))
    const height = Number(image.getAttribute('height'))
    if (width > layout.contentWidth) {
      image.setAttribute('width', Math.round(layout.contentWidth))
      if (height) image.setAttribute('height', Math.round((height * layout.contentWidth) / width))
    }
    const align = image.getAttribute('data-align')
    if (align && align !== 'left') image.outerHTML = `<p align="${align === 'right' ? 'right' : 'center'}">${image.outerHTML}</p>`
  }

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="Generator" content="Doan Docs">
<title>${escapeHtml(title)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>${DOC_STYLE(layout)}</style>
</head>
<body><div class="Section1">${page.innerHTML}</div></body>
</html>`

  const archive = [
    'MIME-Version: 1.0',
    `Content-Type: multipart/related; boundary="${BOUNDARY}"; type="text/html"`,
    '',
    `--${BOUNDARY}`,
    'Content-Type: text/html; charset="utf-8"',
    'Content-Transfer-Encoding: base64',
    'Content-Location: file:///C:/document.htm',
    '',
    base64Lines(utf8Base64(html)),
    ...parts.flatMap((part) => [
      `--${BOUNDARY}`,
      `Content-Type: ${part.type}`,
      'Content-Transfer-Encoding: base64',
      `Content-Location: file:///C:/${part.name}`,
      '',
      base64Lines(part.data.replace(/\s+/g, '')),
    ]),
    `--${BOUNDARY}--`,
    '',
  ].join('\r\n')

  return new Blob([archive], { type: 'application/msword' })
}
