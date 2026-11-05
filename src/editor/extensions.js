import { Extension } from '@tiptap/core'
import Image from '@tiptap/extension-image'
import { TableKit } from '@tiptap/extension-table'
import TextAlign from '@tiptap/extension-text-align'
import { Color, TextStyle } from '@tiptap/extension-text-style'
import { Placeholder } from '@tiptap/extensions'
import StarterKit from '@tiptap/starter-kit'
import { createPagination } from './pagination.js'

/** Images can sit left, center or right; the choice is stored as data-align. */
const ImageAlignment = Extension.create({
  name: 'imageAlignment',
  addGlobalAttributes: () => [
    {
      types: ['image'],
      attributes: {
        align: {
          default: 'center',
          parseHTML: (element) => element.getAttribute('data-align') ?? 'center',
          renderHTML: (attributes) => ({ 'data-align': attributes.align }),
        },
      },
    },
  ],
})

/**
 * A paragraph can open with an illuminated capital: a large gold letter in a
 * navy box, stored as data-drop-cap and drawn by `.doc-body p[data-drop-cap]`.
 */
const DropCap = Extension.create({
  name: 'dropCap',
  addGlobalAttributes: () => [
    {
      types: ['paragraph'],
      attributes: {
        dropCap: {
          default: false,
          parseHTML: (element) => element.hasAttribute('data-drop-cap'),
          renderHTML: (attributes) => (attributes.dropCap ? { 'data-drop-cap': '' } : {}),
        },
      },
    },
  ],
})

export const createExtensions = ({ getLayout, onPagesChange }) => [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: { openOnClick: false, autolink: true },
  }),
  TextStyle,
  Color,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  TableKit.configure({
    table: { resizable: true, HTMLAttributes: { class: 'doc-table' } },
  }),
  ImageAlignment,
  DropCap,
  Image.configure({
    allowBase64: true,
    resize: { enabled: true, alwaysPreserveAspectRatio: true, minWidth: 48, directions: ['bottomRight', 'bottomLeft', 'topRight', 'topLeft'] },
  }),
  Placeholder.configure({ placeholder: 'Start writing…' }),
  createPagination({ getLayout, onPagesChange }),
]
