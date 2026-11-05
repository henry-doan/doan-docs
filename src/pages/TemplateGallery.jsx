import { createDocument } from '../lib/documentStore.js'
import { navigate } from '../lib/router.js'
import { TEMPLATES } from '../lib/templates.js'
import { sanitizeHtml } from '../lib/sanitize.js'

/** A miniature, non-interactive render of the template's first page. */
const TemplatePreview = ({ content }) => (
  <div className="template-preview" aria-hidden="true">
    <div className="template-preview-page" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
  </div>
)

const TemplateGallery = () => (
  <div className="list-page">
    <title>Templates – Doan Docs</title>
    <header className="page-header">
      <div>
        <h1>Templates</h1>
        <p>Start from a page that’s already laid out.</p>
      </div>
    </header>
    <ul className="template-grid">
      {TEMPLATES.map((template) => (
        <li key={template.id}>
          <button
            type="button"
            className="template-card"
            onClick={() =>
              navigate(`/doc/${createDocument({ title: template.title, content: template.content, folder: null })}`)
            }
          >
            <TemplatePreview content={template.content} />
            <span className="template-name">{template.name}</span>
            <span className="template-description">{template.description}</span>
          </button>
        </li>
      ))}
    </ul>
  </div>
)

export default TemplateGallery
