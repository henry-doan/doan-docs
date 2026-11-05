<p align="center">
  <img src="public/logo.png" alt="Doan Docs" width="220" />
</p>

# Doan Docs

A document editor with a royal navy and gold identity: a royal scriptorium brought into a modern productivity app. It opens on a leather-bound book lying on a candlelit desk. Open the cover, choose **Start new** or **Open document**, and the pages turn while your document loads, then the book zooms into the page and the editor opens. Your documents live as books on a wooden bookcase, guarded by a cat named Sir Pounce.

Part of the Doan suite alongside Doan Excelsior. Built with React 19 and the React Compiler, with no UI framework and no backend.

> **Status:** base app. The start screen, library, branding, and an editor with tables, images, page view, drop caps and wax seals are done. Sharing, and Word and PDF files, are planned for later. See [Roadmap](#roadmap).

## Features

**Book start screen**
- A painted closed book on a desk with a flickering candle, drifting dust and the season’s weather. Click it (or press Enter) to open.
- The front board flips open over the spine with a heavy paper sound. The first page offers **Start new** and **Open document**.
- Choosing either turns six pages, pausing on a two-page illuminated letter, while the work happens. Then it zooms into the blank last page and opens the editor. If an import fails, the pages turn back and the error appears on the first page.
- Each page turn has a paper rustle, made in the browser. The speaker button beside **Skip to library** mutes it, and the choice is remembered.
- **Skip to library** is always visible, and a checkbox turns the intro off. You can turn it back on, or replay it, from the account menu.
- People who have “reduce motion” turned on get a quick fade instead of the animation, and no sounds.

**Library**
- Navy header with logo, document search, notifications and an account menu. The main area sits on the same desk as the intro, with the candle, dust and seasons.
- Sidebar with Home, Recent, Starred, Trash and four folders (Personal, Work, Projects, Templates), each with a count. On phones it becomes a slide-in drawer.
- Greeting that follows the time of day, a **New Document** button, and Blank, Templates and Import cards.
- **Bookshelf:** documents stand as books on a wooden bookcase, colored by folder. Starred books carry a gold ribbon, sealed ones a wax seal. Hover a book for its title card, star and ⋯ menu (Open, Rename, Move to folder, Duplicate, Star, Seal, Move to Trash). Click one and it slides off the shelf and opens. Sort by recently opened, title or folder; list pages also filter by folder.
- Trash with Restore, Delete forever and Empty trash. Moving something to Trash shows an **Undo** toast.
- Quick access panel with the quill and the castle.
- Six templates: Meeting notes, Project plan, Letter, Report, Résumé and Blank.

**Sir Pounce, Keeper of the Archive**
- A navy-and-gold cat asleep on top of the bookcase. He breathes, flicks his tail, and every 30 to 60 seconds wakes with a yawn and watches the quill pointer.
- Click him and he purrs (a soft sound, muted with the page sounds) with a happy squint and floating hearts.
- Every few minutes he paws at the shelf and a book wobbles.
- In the editor, his head peeks over the page when it saves, at most once a minute.
- **Hide Sir Pounce** in the account menu removes him.

**Atmosphere**
- **Quill pointer** everywhere, with a small ink blot where you click.
- **Candle flicker** and **drifting dust** over the desk.
- **Seasons**, from the date: painted snowflakes in winter, cherry petals in spring, fireflies in summer and painted leaves in autumn, tumbling at different depths across the desk and, tiny, over the castles. Holidays add their own (New Year’s confetti, Valentine’s hearts, Halloween bats, Christmas snow) and a gold ribbon above the greeting. **Turn off seasonal effects** is in the account menu.
- **Waving flags** on the castle.
- People who prefer reduced motion see all of this standing still, and no falling particles.

**Secret: the castle**
- Either castle (sidebar or Quick access) is a hidden door. Hovering shows “A distant kingdom…”. Clicking it grows the castle to fill the screen under a starry sky, “To Excelsior…” appears, and after about four seconds the tab goes to [Doan Excelsior](https://doan-excelsior.netlify.app/).
- It is a real link: Tab and Enter work, and middle-click or Ctrl/Cmd-click opens Excelsior in a new tab without the animation.

**Editor**
- Built on Tiptap (ProseMirror): headings, bold, italic, underline, strikethrough, text color, lists, alignment, quotes, links, clear formatting, and reliable undo and redo.
- **Illuminated first letter:** a toolbar button turns a paragraph’s first letter into a large gold capital in a navy box. It survives an HTML download and re-import.
- **Tables:** insert one from a grid picker (up to 8 × 8). While the cursor is in a table, a Table bar adds rows and columns, deletes them, toggles the header row, merges and splits cells, or deletes the table. Drag a column edge to resize it.
- **Images:** insert from your device, paste from the clipboard, or drag onto the page. Large photos are scaled to 1600 px wide. Select an image for the Image bar: Small, Medium, Large or Full width; align left, center or right; alt text; remove. Drag a corner handle to resize freely.
- **Page view:** the document is laid out on sheets of paper with a gap between them, page numbers and a page count. Text that would cross the bottom of a page moves to the next one. **Page setup** sets Letter, A4 or Legal, portrait or landscape, and Normal, Narrow, Moderate or Wide margins. **Pageless** switches to one continuous page.
- **Print** uses the document’s paper size and margins.
- Click the title to rename. Changes save automatically, and each save stamps a small wax seal beside **Saved**.
- **Seal a document:** the seal button in the header (or **Seal document** in the ⋯ menu) makes it read-only and presses a wax seal onto the first page. **Break seal** cracks the seal in two and unlocks it.

**Files**

| Format | Open | Save |
| ------ | ---- | ---- |
| Plain text `.txt`, Markdown `.md` | Yes | `.txt` |
| Web page `.html` | Yes | Yes (keeps tables and images) |

Word and PDF support is planned for a later release.

## Getting started

You need Node.js 20.19 or later.

```bash
npm install
npm run dev
```

| Command           | What it does                                    |
| ----------------- | ----------------------------------------------- |
| `npm run dev`     | Starts the development server (`yarn dev` works too) |
| `npm run build`   | Builds a static site into `dist/`               |
| `npm run preview` | Serves the build locally                        |
| `npm run lint`    | Checks the code, including the house style rules |

The app uses hash URLs (`#/home`, `#/doc/abc123`), so `dist/` works on any static host with no server setup.

**Previewing a season:** add `?season=` before the `#` (everything after the `#` is the app’s page, so `#/home?season=winter` won’t work). With the dev server running:

| To see | Open |
| ------ | ---- |
| Winter (painted snowflakes) | [`/?season=winter#/home`](http://localhost:5173/?season=winter#/home) |
| Spring (cherry petals) | [`/?season=spring#/home`](http://localhost:5173/?season=spring#/home) |
| Summer (fireflies) | [`/?season=summer#/home`](http://localhost:5173/?season=summer#/home) |
| Autumn (painted leaves) | [`/?season=autumn#/home`](http://localhost:5173/?season=autumn#/home) |
| New Year’s Day (confetti and ribbon) | [`/?season=new-year#/home`](http://localhost:5173/?season=new-year#/home) |
| Valentine’s Day (hearts and ribbon) | [`/?season=valentines#/home`](http://localhost:5173/?season=valentines#/home) |
| Halloween (bats and ribbon) | [`/?season=halloween#/home`](http://localhost:5173/?season=halloween#/home) |
| Christmas (snow and ribbon) | [`/?season=christmas#/home`](http://localhost:5173/?season=christmas#/home) |
| New Year’s Eve (confetti and ribbon) | [`/?season=new-years-eve#/home`](http://localhost:5173/?season=new-years-eve#/home) |

Change the part after the `#` for other pages, for example `/?season=winter#/intro` for the book in the snow. Remove `?season=…` to go back to today’s date. If **Turn off seasonal effects** is set in the account menu, previews show nothing seasonal.

## Where your documents live

Everything is saved in this browser’s IndexedDB, which has room for images (localStorage doesn’t). Libraries saved by earlier versions in localStorage move over automatically the first time the app loads. Changes are written about a second after you stop typing, and straight away when you leave the editor. There’s no account system or server, so documents don’t sync between browsers or devices, and clearing site data deletes them. The sample documents and the welcome notification are demo content. **Reset sample library** in the account menu restores them.

## Brand

The logo is the supplied artwork in `docs/logo-reference.png`. The original has a soft navy cloud around it, so the files the app uses were cut out onto a transparent background with the cloud removed:

| File | What it is | Used in |
| ---- | ---------- | ------- |
| `src/assets/emblem.png` | Shield, page, quill and crown, no lettering | Header, book cover, editor, loading page |
| `public/logo.png` | Full logo with the DOAN DOCS lettering | README, sharing previews |
| `public/icon-*.png`, `apple-touch-icon.png`, `favicon.ico` | Emblem on a rounded navy square | Browser tab, phone home screen, installed app |

In the header, “DOAN DOCS” beside the emblem is set in Cinzel rather than taken from the image, so it stays crisp at small sizes. `src/components/Logo.jsx` provides the `full`, `compact` and `icon` variants.

### Artwork

The painted artwork is kept in `src/assets` as the original PNGs. The app loads smaller, trimmed `.webp` copies made from them; any fake checkerboard or white backgrounds were cut out.

| Original | Web copies | Used for |
| -------- | ---------- | -------- |
| `bg.png` | `intro/bg.webp`, `intro/candle-glow.webp` | The desk behind the intro and the library, and the candle’s glow |
| `cover.png` | `intro/cover.webp` | The closed book |
| `inside.png` | `intro/inside.webp`, `intro/cover-board.webp`, `intro/page-paper.webp` | The open book, its flipping front board, and the turning pages |
| `blank.png` | `intro/page-blank.webp` | Blank turning pages and the last page |
| `written.png` | `intro/written-left.webp`, `intro/written-right.webp`, `seal.webp` | The two-page letter, and the wax seal |
| `quiil.png` | `quill.webp`, `intro/quill-cursor.png` | The quill illustration and the pointer |
| `docdoan castle.png` | `castle.webp`, `castle-large.webp`, `castle-flag-*.webp` | The castle, its full-screen version, and its three waving flags |
| `leaves.png`, `pink-petals.png`, `snowflakes.png` | `particles/*.webp` | Autumn, spring and winter particles |

To add painted sprites for another season (fireflies, confetti, hearts, bats), make a sheet of separate pieces on a plain white background in the same style.

To change the logo, replace these files with new versions at the same sizes (transparent backgrounds) and update `EMBLEM_RATIO` in `Logo.jsx` if the emblem’s proportions change.

### Colors

All colors are CSS variables at the top of `src/styles.css`.

| Token            | Hex       | Use                                   |
| ---------------- | --------- | ------------------------------------- |
| `--royal-navy`   | `#14243B` | Sidebar, headings, book cover         |
| `--deep-navy`    | `#071827` | Header, toasts, inside cover          |
| `--antique-gold` | `#C9A65B` | Primary buttons, selection, accents   |
| `--bright-gold`  | `#E4C783` | Hover, active text on navy            |
| `--parchment`    | `#F5F0E6` | Intro backdrop, toolbar, hover rows   |
| `--white`        | `#FFFFFF` | Document page, cards                  |
| `--ink`          | `#252B35` | Body text                             |
| `--muted`        | `#748092` | Secondary text                        |
| `--border`       | `#E3DED3` | Borders                               |
| `--success`      | `#2F855A` | Success states                        |

### Type

Cinzel for the wordmark, EB Garamond for headings and the document page, Source Sans 3 for the interface. All three load from Google Fonts, with system fallbacks.

## Project structure

```
src/
├── main.jsx, App.jsx         Entry point and routing
├── styles.css                Tokens and every style, including the book
├── editor/
│   ├── extensions.js         Tiptap setup: text, tables, images, alignment, drop caps, pagination
│   ├── pagination.js         Moves blocks to the next sheet in page view
│   ├── pageSetup.js          Paper sizes and margins
│   ├── images.js             Scales pictures and stores them in the document
│   ├── EditorToolbar.jsx     Formatting, insert and view controls
│   ├── ContextBar.jsx        Table and Image tools
│   ├── TablePicker.jsx       Rows × columns grid
│   └── PageSetupDialog.jsx
├── pages/
│   ├── BookIntro.jsx         The book start screen, cover flip and page turns
│   ├── DashboardPage.jsx     Greeting, quick actions, recent documents, quick access
│   ├── ListPage.jsx          Recent, Starred, Trash and folder views
│   ├── TemplateGallery.jsx   Template picker
│   └── EditorPage.jsx        The editor
├── components/
│   ├── AppShell.jsx          Header + sidebar + page
│   ├── AppHeader.jsx         Logo, search, notifications, account menu
│   ├── Sidebar.jsx           Navigation and folders, drawer on phones
│   ├── Bookshelf.jsx         Documents as books on the bookcase
│   ├── SirPounce.jsx         The cat on the shelf, and his peek in the editor
│   ├── Ambience.jsx          Dust and seasonal particles
│   ├── DocumentActions.jsx   ⋯ menu with Rename, Move and Delete dialogs
│   ├── NewDocumentButton.jsx
│   ├── Logo.jsx              Emblem, wordmark, logo variants
│   ├── Illustrations.jsx     Castle (with the Excelsior journey) and quill
│   ├── Menu.jsx, Dialog.jsx, Toast.jsx, EmptyState.jsx, Icon.jsx
├── hooks/
│   ├── useLibrary.js         Subscribes to the document store
│   ├── useRoute.js           Current route from the URL
│   ├── useImportDocument.jsx File picker → new document
│   └── useDismiss.js         Close popovers on outside click or Escape
└── lib/
    ├── documentStore.js      Documents, page setup, profile, settings
    ├── router.js             Hash router
    ├── storage.js            IndexedDB persistence
    ├── fileImport.js         Text and HTML import, .txt and .html download
    ├── sanitize.js           Cleans imported HTML so files can’t run scripts
    ├── sound.js              Page turns, cover, purr and whoosh, made with Web Audio
    ├── seasons.js            Season and holiday for a date, and ?season= previews
    ├── inkSplash.js          Ink blot where the quill clicks
    ├── templates.js, folders.js, dates.js, toastStore.js
```

## How page view works

Splitting a live document into separate pages makes editing fragile, so the text stays one continuous document. After every change, the pagination extension measures each top-level block (paragraph, heading, list, table, image). Where a block would cross the bottom of a page’s text area, it inserts an invisible spacer that pushes that block to the top of the next sheet. The sheets of paper are drawn behind the text, one per page.

Every block uses bottom margins only, so heights add up exactly. Spacers are display-only: they aren’t saved, aren’t part of undo, and are hidden when printing, where the browser’s own page breaks take over.

Two limits: a single block taller than a page (a very long table, say) can’t be pushed and runs over the page edge, and lines within one paragraph move together, so a long paragraph near the bottom moves to the next page whole. Pageless view has neither limit.

## How the book works

The book is painted artwork laid out in one 3:2 frame (the size of the source images), so every layer lines up by percentage. The closed cover is `cover.webp`. Clicking it fades to the same book seen flat (`inside.webp`) whose front board is a separate 3D “leaf” that turns over the spine.

The right-hand page is a stack of leaves, each with a front and back face, hinged on the spine. Turning a page rotates it `-180deg` around that hinge. Each leaf also sits a fraction of a pixel above the one beneath it (`translateZ`), and because a 180° turn flips that offset, pages land on the left in the right order without any z-index juggling. The timing of each turn comes from one function, `pageDelay()` in `BookIntro.jsx`, which both the animation and the page-turn sounds use.

The work behind **Start new** and **Open document** runs as a React 19 action (`useActionState`). Its pending state *is* “the pages are turning”: the animation lasts at least as long as the pages take to turn, and longer if the import is slow. When the action finishes, the book zooms in and the editor opens.

## Code style

- Every function is a `const` arrow function, including components. ESLint fails on the `function` keyword (`func-style`, `prefer-arrow-callback`, `no-restricted-syntax`).
- No `useMemo`, `useCallback` or `React.memo`: the React Compiler handles memoization.
- One component per file, plain JavaScript with JSX, no CSS framework.

## React 19 features used

| Feature                        | Where                                   |
| ------------------------------ | --------------------------------------- |
| React Compiler                 | Whole app                               |
| `useActionState` + transitions | Book intro, Import                      |
| `useEffectEvent`               | Saving when leaving the editor, popover dismissal |
| `useSyncExternalStore`         | Document store, router, toasts          |
| `<title>` and `<style>` in components | Tab titles; print paper size per document |
| `inert` prop                   | Hides the book’s buttons until it’s open |
| `useId`                        | Unique SVG gradient ids for Sir Pounce  |

## Accessibility

Keyboard access throughout, visible gold focus rings, a skip-to-content button, labelled icon buttons, menus with arrow-key navigation, native `<dialog>` modals, live regions for save status and toasts, and reduced-motion support.

## Roadmap

**Next**
- Painted art for Sir Pounce, and painted fireflies, confetti, hearts and bats.
- Save immediately when the tab closes, and export or import the whole library as a backup file.
- Splitting long paragraphs and tables across pages.
- Fonts and font sizes, headers and footers.
- Word (.docx, .doc) and PDF import and export.

**Later**
- Sharing, comments and sync (needs a backend).

## Licensing

| Library | Used for | License |
| ------- | -------- | ------- |
| React, Vite | App | MIT |
| Tiptap, ProseMirror | Editor | MIT |

Fonts are under the SIL Open Font License. Choose a license for your own code that’s compatible with these.
