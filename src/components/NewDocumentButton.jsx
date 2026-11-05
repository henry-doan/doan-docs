import { createDocument } from '../lib/documentStore.js'
import { navigate } from '../lib/router.js'
import Icon from './Icon.jsx'

const NewDocumentButton = ({ folder = null, label = 'New Document' }) => (
  <button type="button" className="button button-gold new-document" onClick={() => navigate(`/doc/${createDocument({ folder })}`)}>
    <Icon name="plus" size={18} />
    {label}
  </button>
)

export default NewDocumentButton
