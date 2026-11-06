/**
 * Builds a Word (.docx) file from the editor's document. Loaded only when
 * someone downloads one, so the docx library stays out of the main bundle.
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import { columnWidths, exportImage, fitWithin, hexColor, tableGrid } from './exportImages.js'

/** Twentieths of a point per CSS pixel. */
const TWIPS = 15
const NAVY = '14243B'
const GOLD = 'C9A65B'
const BRIGHT_GOLD = 'E4C783'
const INK = '252B35'
const MUTED = '5B6576'
const FONT = 'Georgia'

const ALIGNMENT = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
}

const BULLETS = ['•', '◦', '▪']
const NUMBER_FORMATS = [LevelFormat.DECIMAL, LevelFormat.LOWER_LETTER, LevelFormat.LOWER_ROMAN]
const LEVELS = Array.from({ length: 9 }, (_, level) => level)
const listIndent = (level) => ({ indent: { left: 720 * (level + 1), hanging: 360 } })

const NUMBERING = {
  config: [
    {
      reference: 'bullets',
      levels: LEVELS.map((level) => ({
        level,
        format: LevelFormat.BULLET,
        text: BULLETS[level % 3],
        alignment: AlignmentType.LEFT,
        style: { paragraph: listIndent(level) },
      })),
    },
    {
      reference: 'numbers',
      levels: LEVELS.map((level) => ({
        level,
        format: NUMBER_FORMATS[level % 3],
        text: `%${level + 1}.`,
        alignment: AlignmentType.LEFT,
        style: { paragraph: listIndent(level) },
      })),
    },
  ],
}

const collectImages = (node, found = []) => {
  if (node.type === 'image') found.push(node)
  node.content?.forEach((child) => collectImages(child, found))
  return found
}

const markOf = (node, type) => node.marks?.find((mark) => mark.type === type)

const textRun = (text, node, extra = {}) => {
  const code = markOf(node, 'code')
  return new TextRun({
    text,
    bold: Boolean(markOf(node, 'bold')) || undefined,
    italics: Boolean(markOf(node, 'italic')) || undefined,
    underline: markOf(node, 'underline') ? {} : undefined,
    strike: Boolean(markOf(node, 'strike')) || undefined,
    color: hexColor(markOf(node, 'textStyle')?.attrs?.color),
    font: code ? 'Courier New' : undefined,
    shading: code ? { type: ShadingType.CLEAR, fill: 'F1EDE4' } : undefined,
    ...extra,
  })
}

/** The illuminated first letter: gold on navy, as in the editor. */
const dropCapRun = (letter) =>
  new TextRun({
    text: letter,
    bold: true,
    size: 64,
    font: FONT,
    color: BRIGHT_GOLD,
    shading: { type: ShadingType.CLEAR, fill: NAVY },
  })

const inlineRuns = (nodes = [], { dropCap = false, quote = false } = {}) => {
  const runs = []
  let needsCap = dropCap
  for (const node of nodes) {
    if (node.type === 'hardBreak') {
      runs.push(new TextRun({ break: 1 }))
      continue
    }
    if (node.type !== 'text' || !node.text) continue
    let text = node.text
    if (needsCap) {
      const [letter] = text
      runs.push(dropCapRun(letter))
      text = text.slice(letter.length)
      needsCap = false
      if (!text) continue
    }
    const link = markOf(node, 'link')
    if (link?.attrs?.href) {
      runs.push(
        new ExternalHyperlink({
          link: link.attrs.href,
          children: [textRun(text, node, { italics: quote || undefined, color: '1F4E9A', underline: {} })],
        }),
      )
    } else {
      const ownColor = hexColor(markOf(node, 'textStyle')?.attrs?.color)
      runs.push(textRun(text, node, quote ? { italics: true, color: ownColor ?? MUTED } : {}))
    }
  }
  return runs
}

const createBuilder = ({ images, contentWidth }) => {
  let listInstance = 0

  const quoteStyle = {
    indent: { left: 360 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: GOLD, space: 12 } },
  }

  const blocks = (nodes = [], context = {}) => nodes.flatMap((node) => block(node, context))

  const paragraphOptions = (node, context) => ({
    alignment: ALIGNMENT[node.attrs?.textAlign],
    ...(context.quote ? quoteStyle : {}),
    ...(context.numbering ? { numbering: context.numbering } : {}),
    ...(context.listIndent !== undefined && !context.numbering ? { indent: { left: context.listIndent } } : {}),
  })

  const block = (node, context) => {
    switch (node.type) {
      case 'paragraph':
        return new Paragraph({
          ...paragraphOptions(node, context),
          children: inlineRuns(node.content, { dropCap: node.attrs?.dropCap, quote: context.quote }),
        })
      case 'heading':
        return new Paragraph({
          ...paragraphOptions(node, context),
          heading: HeadingLevel[`HEADING_${node.attrs?.level ?? 1}`],
          children: inlineRuns(node.content, { quote: context.quote }),
        })
      case 'blockquote':
        return blocks(node.content, { ...context, quote: true })
      case 'bulletList':
      case 'orderedList':
        return list(node, context)
      case 'codeBlock': {
        const lines = (node.content ?? []).map((child) => child.text ?? '').join('').split('\n')
        return new Paragraph({
          shading: { type: ShadingType.CLEAR, fill: 'F1EDE4' },
          children: lines.map((line, index) => new TextRun({ text: line, font: 'Courier New', size: 20, break: index ? 1 : 0 })),
        })
      }
      case 'horizontalRule':
        return new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 1 } } })
      case 'image':
        return image(node)
      case 'table':
        return [table(node), new Paragraph({})]
      default:
        return node.content ? blocks(node.content, context) : []
    }
  }

  const list = (node, context) => {
    const level = context.level === undefined ? 0 : context.level + 1
    const ordered = node.type === 'orderedList'
    const numbering = ordered
      ? { reference: 'numbers', level, instance: (listInstance += 1) }
      : { reference: 'bullets', level }
    return (node.content ?? []).flatMap((item) =>
      (item.content ?? []).flatMap((child, index) => {
        const isList = child.type === 'bulletList' || child.type === 'orderedList'
        return block(child, {
          ...context,
          level: isList ? level : context.level,
          numbering: index === 0 && !isList ? numbering : undefined,
          listIndent: 720 * (level + 1),
        })
      }),
    )
  }

  const image = (node) => {
    const picture = images.get(node)
    if (!picture) return []
    const size = fitWithin(picture, contentWidth)
    const alt = node.attrs?.alt || 'Image'
    return new Paragraph({
      alignment: ALIGNMENT[node.attrs?.align] ?? AlignmentType.CENTER,
      children: [
        new ImageRun({
          type: picture.type,
          data: picture.bytes,
          transformation: { width: size.width, height: size.height },
          altText: { name: alt, title: alt, description: alt },
        }),
      ],
    })
  }

  const table = (node) => {
    const { rows, columns } = tableGrid(node)
    const widths = columnWidths(node, columns, contentWidth).map((width) => Math.round(width * TWIPS))
    const border = { style: BorderStyle.SINGLE, size: 4, color: 'D8D2C4' }
    return new Table({
      width: { size: widths.reduce((sum, width) => sum + width, 0), type: WidthType.DXA },
      columnWidths: widths,
      borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
      rows: rows.map(
        (cells, rowIndex) =>
          new TableRow({
            tableHeader: rowIndex === 0 && cells.every((cell) => cell.node.type === 'tableHeader'),
            children: cells.map(({ node: cell, column, colspan, rowspan }) => {
              const header = cell.type === 'tableHeader'
              const content = blocks(cell.content)
              return new TableCell({
                columnSpan: colspan > 1 ? colspan : undefined,
                rowSpan: rowspan > 1 ? rowspan : undefined,
                width: { size: widths.slice(column, column + colspan).reduce((sum, width) => sum + width, 0), type: WidthType.DXA },
                shading: header ? { type: ShadingType.CLEAR, fill: 'F5F0E6' } : undefined,
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: content.length ? content : [new Paragraph({})],
              })
            }),
          }),
      ),
    })
  }

  return { blocks }
}

/** Returns the .docx file as a Blob. `layout` is the document's page layout in CSS pixels. */
export const buildDocx = async ({ title, json, layout }) => {
  const images = new Map()
  await Promise.all(
    collectImages(json).map(async (node) => images.set(node, await exportImage(node.attrs ?? {}, ['png', 'jpg', 'gif']))),
  )

  const { blocks } = createBuilder({ images, contentWidth: layout.contentWidth })
  const children = blocks(json.content)
  const isLandscape = layout.width > layout.height

  const document = new Document({
    title,
    creator: 'Doan Docs',
    numbering: NUMBERING,
    styles: {
      default: {
        document: { run: { font: FONT, size: 27, color: INK }, paragraph: { spacing: { after: 190, line: 336 } } },
        heading1: { run: { font: FONT, size: 54, bold: true, color: NAVY }, paragraph: { spacing: { before: 0, after: 200 } } },
        heading2: { run: { font: FONT, size: 39, bold: true, color: NAVY }, paragraph: { spacing: { before: 240, after: 120 } } },
        heading3: { run: { font: FONT, size: 32, bold: true, color: INK }, paragraph: { spacing: { before: 200, after: 100 } } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: Math.round(Math.min(layout.width, layout.height) * TWIPS),
              height: Math.round(Math.max(layout.width, layout.height) * TWIPS),
              orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
            },
            margin: {
              top: Math.round(layout.marginTop * TWIPS),
              bottom: Math.round(layout.marginBottom * TWIPS),
              left: Math.round(layout.marginSide * TWIPS),
              right: Math.round(layout.marginSide * TWIPS),
            },
          },
        },
        children: children.length ? children : [new Paragraph({})],
      },
    ],
  })

  return Packer.toBlob(document)
}
