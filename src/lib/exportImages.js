/**
 * Turns a document image into what a Word or PDF file can hold. Word takes
 * PNG, JPEG and GIF; PDF takes PNG and JPEG. Anything else (WebP, or a GIF
 * in a PDF) is redrawn as a PNG. Images that can't be loaded, such as a
 * picture on another site that blocks it, come back as null and are left out.
 */

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })

const typeOf = (dataUrl) => dataUrl.match(/^data:image\/([a-z+]+)/i)?.[1].toLowerCase().replace('jpeg', 'jpg') ?? null

const toPng = (image) => {
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  canvas.getContext('2d').drawImage(image, 0, 0)
  return canvas.toDataURL('image/png')
}

const bytesOf = (dataUrl) => {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

/**
 * Returns `{ dataUrl, bytes, type, width, height }`, with `type` one of
 * `accepted`, or null. Width and height are the size shown in the document.
 */
export const exportImage = async ({ src, width, height }, accepted) => {
  if (!src) return null
  try {
    const image = await loadImage(src)
    let dataUrl = src.startsWith('data:') ? src : null
    let type = dataUrl && typeOf(dataUrl)
    if (!dataUrl || !accepted.includes(type)) {
      dataUrl = toPng(image)
      type = 'png'
    }
    const shownWidth = Number(width) || image.naturalWidth
    const shownHeight = Number(height) || Math.round((image.naturalHeight * shownWidth) / image.naturalWidth)
    return { dataUrl, bytes: bytesOf(dataUrl), type, width: shownWidth, height: shownHeight }
  } catch {
    return null
  }
}

/** Shrinks a size to fit the page's text width, keeping its shape. */
export const fitWithin = ({ width, height }, maxWidth) =>
  width <= maxWidth ? { width, height } : { width: maxWidth, height: Math.round((height * maxWidth) / width) }

/** Colors from the editor ("#c9a65b", "#abc", "rgb(…)") as six hex digits, or undefined. */
export const hexColor = (color) => {
  if (!color) return undefined
  const value = color.trim()
  const short = value.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i)
  if (short) return short.slice(1).map((digit) => digit + digit).join('').toUpperCase()
  const long = value.match(/^#([0-9a-f]{6})$/i)
  if (long) return long[1].toUpperCase()
  const rgb = value.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i)
  if (rgb) return rgb.slice(1, 4).map((part) => Number(part).toString(16).padStart(2, '0')).join('').toUpperCase()
  return undefined
}

/**
 * Lays a table's rows out on a grid, so cells spanning rows or columns land
 * in the right column. Returns rows of `{ node, column, colspan, rowspan }`
 * plus the column count.
 */
export const tableGrid = (table) => {
  const taken = []
  const rows = (table.content ?? []).map((row, rowIndex) => {
    taken[rowIndex] ??= []
    let column = 0
    return (row.content ?? []).map((cell) => {
      while (taken[rowIndex][column]) column += 1
      const colspan = cell.attrs?.colspan ?? 1
      const rowspan = cell.attrs?.rowspan ?? 1
      for (let r = 0; r < rowspan; r += 1) {
        taken[rowIndex + r] ??= []
        for (let c = 0; c < colspan; c += 1) taken[rowIndex + r][column + c] = true
      }
      const placed = { node: cell, column, colspan, rowspan }
      column += colspan
      return placed
    })
  })
  const columns = Math.max(1, ...taken.map((row) => row?.length ?? 0))
  return { rows, columns }
}

/** Column widths in pixels from the widths dragged in the editor, sharing out the rest evenly. */
export const columnWidths = (table, columns, totalWidth) => {
  const widths = Array(columns).fill(null)
  const firstRow = table.content?.[0]?.content ?? []
  let column = 0
  for (const cell of firstRow) {
    const colwidth = cell.attrs?.colwidth
    for (let c = 0; c < (cell.attrs?.colspan ?? 1); c += 1) {
      if (colwidth?.[c]) widths[column + c] = colwidth[c]
    }
    column += cell.attrs?.colspan ?? 1
  }
  const fixed = widths.reduce((sum, width) => sum + (width ?? 0), 0)
  const open = widths.filter((width) => width === null).length
  const share = open ? Math.max(40, (totalWidth - fixed) / open) : 0
  const filled = widths.map((width) => width ?? share)
  const scale = Math.min(1, totalWidth / filled.reduce((sum, width) => sum + width, 0))
  return filled.map((width) => width * scale)
}
