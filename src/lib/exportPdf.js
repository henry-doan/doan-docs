/**
 * Builds a PDF from the editor's document, with real, selectable text. Loaded
 * only when someone downloads one, so pdfmake and its fonts stay out of the
 * main bundle.
 */
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { columnWidths, exportImage, fitWithin, hexColor, tableGrid } from './exportImages.js'

pdfMake.addVirtualFileSystem(pdfFonts)

/** PDF points per CSS pixel. */
const POINTS = 0.75
const NAVY = '#14243B'
const GOLD = '#C9A65B'
const BRIGHT_GOLD = '#E4C783'
const INK = '#252B35'
const MUTED = '#5B6576'
const RULE = '#D8D2C4'
const BODY_SIZE = 13.5
const CELL_PADDING = 6
const RULE_WIDTH = 0.75

const collectImages = (node, found = []) => {
  if (node.type === 'image') found.push(node)
  node.content?.forEach((child) => collectImages(child, found))
  return found
}

const markOf = (node, type) => node.marks?.find((mark) => mark.type === type)

const textPiece = (text, node) => {
  const piece = { text }
  if (markOf(node, 'bold')) piece.bold = true
  if (markOf(node, 'italic')) piece.italics = true
  const decoration = [markOf(node, 'underline') && 'underline', markOf(node, 'strike') && 'lineThrough'].filter(Boolean)
  const link = markOf(node, 'link')?.attrs?.href
  if (link) {
    piece.link = link
    piece.color = '#1F4E9A'
    if (!decoration.includes('underline')) decoration.push('underline')
  }
  if (decoration.length) piece.decoration = decoration.length === 1 ? decoration[0] : decoration
  const color = hexColor(markOf(node, 'textStyle')?.attrs?.color)
  if (color && !link) piece.color = `#${color}`
  if (markOf(node, 'code')) piece.background = '#F1EDE4'
  return piece
}

const inlineText = (nodes = [], { dropCap = false } = {}) => {
  const pieces = []
  let needsCap = dropCap
  for (const node of nodes) {
    if (node.type === 'hardBreak') {
      pieces.push({ text: '\n' })
      continue
    }
    if (node.type !== 'text' || !node.text) continue
    let text = node.text
    if (needsCap) {
      const [letter] = text
      pieces.push({ text: ` ${letter} `, fontSize: BODY_SIZE * 2.6, bold: true, color: BRIGHT_GOLD, background: NAVY })
      text = text.slice(letter.length)
      needsCap = false
      if (!text) continue
    }
    pieces.push(textPiece(text, node))
  }
  return pieces.length ? pieces : [{ text: ' ' }]
}

const createBuilder = ({ images, contentWidth }) => {
  const contentPoints = contentWidth * POINTS

  const blocks = (nodes = []) => nodes.flatMap((node) => block(node))

  const block = (node) => {
    const alignment = node.attrs?.textAlign && node.attrs.textAlign !== 'left' ? node.attrs.textAlign : undefined
    switch (node.type) {
      case 'paragraph':
        return { text: inlineText(node.content, { dropCap: node.attrs?.dropCap }), alignment, style: 'paragraph' }
      case 'heading':
        return { text: inlineText(node.content), alignment, style: `h${node.attrs?.level ?? 1}` }
      case 'blockquote':
        return {
          table: { widths: ['*'], body: [[{ stack: blocks(node.content), italics: true, color: MUTED }]] },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: (index) => (index === 0 ? 2.25 : 0),
            vLineColor: () => GOLD,
            paddingLeft: () => 12,
            paddingTop: () => 0,
            paddingBottom: () => 0,
          },
          margin: [0, 0, 0, 10],
        }
      case 'bulletList':
        return { ul: listItems(node), margin: [0, 0, 0, 8] }
      case 'orderedList':
        return { ol: listItems(node), start: node.attrs?.start ?? 1, margin: [0, 0, 0, 8] }
      case 'codeBlock':
        return {
          table: { widths: ['*'], body: [[{ text: (node.content ?? []).map((child) => child.text ?? '').join(''), fontSize: 10.5, preserveLeadingSpaces: true }]] },
          layout: { hLineWidth: () => 0, vLineWidth: () => 0, fillColor: () => '#F1EDE4', paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 6, paddingBottom: () => 6 },
          margin: [0, 0, 0, 10],
        }
      case 'horizontalRule':
        return { canvas: [{ type: 'line', x1: 0, y1: 0, x2: contentPoints, y2: 0, lineWidth: 0.75, lineColor: GOLD }], margin: [0, 6, 0, 12] }
      case 'image':
        return image(node)
      case 'table':
        return table(node)
      default:
        return node.content ? blocks(node.content) : []
    }
  }

  const listItems = (node) =>
    (node.content ?? []).map((item) => {
      const parts = blocks(item.content).map((part) => ({ ...part, margin: [0, 0, 0, 3] }))
      return parts.length === 1 ? parts[0] : { stack: parts }
    })

  const image = (node) => {
    const picture = images.get(node)
    if (!picture) return []
    const size = fitWithin(picture, contentWidth)
    return {
      image: picture.dataUrl,
      width: size.width * POINTS,
      height: size.height * POINTS,
      alignment: node.attrs?.align ?? 'center',
      margin: [0, 2, 0, 10],
    }
  }

  const table = (node) => {
    const { rows, columns } = tableGrid(node)
    // pdfmake's widths leave out each cell's padding and rule, so those come off here.
    const widths = columnWidths(node, columns, contentWidth).map((width) => Math.max(12, width * POINTS - CELL_PADDING * 2 - RULE_WIDTH))
    const body = rows.map(() => Array.from({ length: columns }, () => ({ text: '' })))
    rows.forEach((cells, rowIndex) => {
      for (const { node: cell, column, colspan, rowspan } of cells) {
        const header = cell.type === 'tableHeader'
        body[rowIndex][column] = {
          stack: blocks(cell.content).map((part) => ({ ...part, margin: [0, 0, 0, 2] })),
          colSpan: colspan > 1 ? colspan : undefined,
          rowSpan: rowspan > 1 ? rowspan : undefined,
          bold: header || undefined,
          fillColor: header ? '#F5F0E6' : undefined,
        }
      }
    })
    const headerRows = rows[0]?.length && rows[0].every((cell) => cell.node.type === 'tableHeader') ? 1 : 0
    return {
      table: { widths, body, headerRows },
      layout: {
        hLineWidth: () => RULE_WIDTH,
        vLineWidth: () => RULE_WIDTH,
        hLineColor: () => RULE,
        vLineColor: () => RULE,
        paddingLeft: () => CELL_PADDING,
        paddingRight: () => CELL_PADDING,
        paddingTop: () => 4,
        paddingBottom: () => 4,
      },
      margin: [0, 2, 0, 12],
    }
  }

  return { blocks }
}

/** Returns the PDF as a Blob. `layout` is the document's page layout in CSS pixels. */
export const buildPdf = async ({ title, json, layout }) => {
  const images = new Map()
  await Promise.all(collectImages(json).map(async (node) => images.set(node, await exportImage(node.attrs ?? {}, ['png', 'jpg']))))

  const { blocks } = createBuilder({ images, contentWidth: layout.contentWidth })
  const side = layout.marginSide * POINTS

  const definition = {
    info: { title, creator: 'Doan Docs', producer: 'Doan Docs' },
    pageSize: { width: layout.width * POINTS, height: layout.height * POINTS },
    pageMargins: [side, layout.marginTop * POINTS, side, layout.marginBottom * POINTS],
    content: json.content?.length ? blocks(json.content) : [{ text: ' ' }],
    defaultStyle: { font: 'Roboto', fontSize: BODY_SIZE, lineHeight: 1.3, color: INK },
    styles: {
      paragraph: { margin: [0, 0, 0, 9] },
      h1: { fontSize: BODY_SIZE * 2, bold: true, color: NAVY, lineHeight: 1.1, margin: [0, 0, 0, 8] },
      h2: { fontSize: BODY_SIZE * 1.45, bold: true, color: NAVY, lineHeight: 1.15, margin: [0, 8, 0, 5] },
      h3: { fontSize: BODY_SIZE * 1.2, bold: true, lineHeight: 1.2, margin: [0, 6, 0, 4] },
    },
    footer: (page, pages) =>
      pages > 1 ? { text: String(page), alignment: 'center', fontSize: 9, color: MUTED, margin: [0, layout.marginBottom * POINTS * 0.4, 0, 0] } : null,
  }

  return pdfMake.createPdf(definition).getBlob()
}
