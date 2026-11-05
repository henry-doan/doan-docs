import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

/**
 * Page view without splitting the document: after each change the editor
 * measures its top-level blocks and, where a block would cross the bottom of
 * a page, inserts an invisible spacer that pushes it to the top of the next
 * sheet. The sheets themselves are drawn behind the text by the editor page.
 *
 * A block taller than a whole page (a very long table, say) can't be pushed
 * and runs past the page edge; everything else lands on a page.
 */

export const paginationKey = new PluginKey('pagination')

const spacerWidget = (height, page) => {
  const spacer = document.createElement('div')
  spacer.className = 'page-spacer'
  spacer.style.height = `${height}px`
  spacer.contentEditable = 'false'
  spacer.setAttribute('aria-hidden', 'true')
  spacer.dataset.page = String(page)
  return spacer
}

const measure = (view, layout) => {
  const breaks = []
  let used = 0
  let pages = 1

  view.state.doc.forEach((node, offset) => {
    const dom = view.nodeDOM(offset)
    if (!(dom instanceof HTMLElement)) return
    const height = dom.offsetHeight
    const marginBottom = parseFloat(getComputedStyle(dom).marginBottom) || 0

    if (used > 0 && used + height > layout.contentHeight) {
      breaks.push({ pos: offset, height: layout.contentHeight - used + layout.marginBottom + layout.gap + layout.marginTop })
      pages += 1
      used = 0
    }
    used += height + marginBottom
  })

  // A block taller than a page still occupies the pages it runs across.
  if (used > layout.contentHeight) pages += Math.ceil(used / layout.contentHeight) - 1
  return { breaks, pages }
}

const sameBreaks = (a, b) =>
  a.length === b.length && a.every((item, index) => item.pos === b[index].pos && Math.abs(item.height - b[index].height) < 0.5)

/**
 * `getLayout()` returns { contentHeight, marginTop, marginBottom, gap }, or
 * null when page view is off. `onPagesChange(count)` reports the page count.
 */
export const createPagination = ({ getLayout, onPagesChange }) =>
  Extension.create({
    name: 'pagination',

    addProseMirrorPlugins: () => [
        new Plugin({
          key: paginationKey,
          state: {
            init: () => ({ breaks: [], decorations: DecorationSet.empty }),
            apply: (transaction, value, _oldState, newState) => {
              const next = transaction.getMeta(paginationKey)
              if (next) {
                const decorations = DecorationSet.create(
                  newState.doc,
                  next.map((item, index) =>
                    Decoration.widget(item.pos, () => spacerWidget(item.height, index + 2), {
                      side: -1,
                      key: `page-${index}-${item.pos}-${Math.round(item.height)}`,
                      ignoreSelection: true,
                    }),
                  ),
                )
                return { breaks: next, decorations }
              }
              return { breaks: value.breaks, decorations: value.decorations.map(transaction.mapping, transaction.doc) }
            },
          },
          props: {
            decorations: (state) => paginationKey.getState(state).decorations,
          },
          view: (view) => {
            let frame = 0
            let lastPages = 0

            const recalculate = () => {
              cancelAnimationFrame(frame)
              frame = requestAnimationFrame(() => {
                if (view.isDestroyed) return
                const layout = getLayout()
                const { breaks, pages } = layout ? measure(view, layout) : { breaks: [], pages: 1 }
                if (!sameBreaks(breaks, paginationKey.getState(view.state).breaks)) {
                  view.dispatch(view.state.tr.setMeta(paginationKey, breaks).setMeta('addToHistory', false))
                }
                if (pages !== lastPages) {
                  lastPages = pages
                  onPagesChange(pages)
                }
              })
            }

            // Images change height when they finish loading; fonts change line breaks.
            const onLoad = (event) => event.target instanceof HTMLImageElement && recalculate()
            view.dom.addEventListener('load', onLoad, true)
            const resizeObserver = new ResizeObserver(recalculate)
            resizeObserver.observe(view.dom)
            document.fonts?.ready.then(recalculate)
            recalculate()

            return {
              update: (_view, previousState) => {
                if (previousState.doc !== view.state.doc || paginationKey.getState(view.state).breaks.length === 0) recalculate()
              },
              destroy: () => {
                cancelAnimationFrame(frame)
                view.dom.removeEventListener('load', onLoad, true)
                resizeObserver.disconnect()
              },
            }
          },
        }),
    ],

    addCommands: () => ({
      // Re-measures after a page size, margin or view change.
      repaginate:
        () =>
        ({ tr, dispatch }) => {
          // Mark the command's own transaction; dispatching a second one from
          // inside a command throws "Applying a mismatched transaction".
          if (dispatch) tr.setMeta(paginationKey, []).setMeta('addToHistory', false)
          return true
        },
    }),
  })
