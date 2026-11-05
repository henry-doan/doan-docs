/** Paper sizes and margins in CSS pixels (96 per inch), as Word and Google Docs use. */

const INCH = 96

export const PAPER_SIZES = [
  { id: 'letter', label: 'Letter', detail: '8.5 × 11 in', width: 8.5 * INCH, height: 11 * INCH, css: 'letter' },
  { id: 'a4', label: 'A4', detail: '210 × 297 mm', width: 794, height: 1123, css: 'A4' },
  { id: 'legal', label: 'Legal', detail: '8.5 × 14 in', width: 8.5 * INCH, height: 14 * INCH, css: 'legal' },
]

export const MARGIN_PRESETS = [
  { id: 'normal', label: 'Normal', detail: '1 in all around', top: INCH, side: INCH },
  { id: 'narrow', label: 'Narrow', detail: '0.5 in', top: INCH / 2, side: INCH / 2 },
  { id: 'moderate', label: 'Moderate', detail: '1 in top and bottom, 0.75 in sides', top: INCH, side: 0.75 * INCH },
  { id: 'wide', label: 'Wide', detail: '1 in top and bottom, 1.5 in sides', top: INCH, side: 1.5 * INCH },
]

/** Space between two sheets of paper on screen. */
export const PAGE_GAP = 24

/** Turns a document's page setup into the measurements the layout needs. */
export const pageLayout = ({ size, orientation, margins }) => {
  const paper = PAPER_SIZES.find((item) => item.id === size) ?? PAPER_SIZES[0]
  const margin = MARGIN_PRESETS.find((item) => item.id === margins) ?? MARGIN_PRESETS[0]
  const isLandscape = orientation === 'landscape'
  const width = isLandscape ? paper.height : paper.width
  const height = isLandscape ? paper.width : paper.height
  return {
    width,
    height,
    marginTop: margin.top,
    marginBottom: margin.top,
    marginSide: margin.side,
    contentWidth: width - margin.side * 2,
    contentHeight: height - margin.top * 2,
    printSize: `${paper.css} ${isLandscape ? 'landscape' : 'portrait'}`,
    printMargin: `${margin.top / INCH}in ${margin.side / INCH}in`,
  }
}
