import { Quill } from './Illustrations.jsx'

const EmptyState = ({ title, message, action }) => (
  <div className="empty-state">
    <Quill size={56} />
    <h2>{title}</h2>
    <p>{message}</p>
    {action}
  </div>
)

export default EmptyState
