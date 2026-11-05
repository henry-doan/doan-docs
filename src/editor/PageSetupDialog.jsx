import { useState } from 'react'
import Dialog from '../components/Dialog.jsx'
import { MARGIN_PRESETS, PAPER_SIZES } from './pageSetup.js'

const ChoiceGroup = ({ legend, name, options, value, onChange }) => (
  <fieldset className="choice-group">
    <legend>{legend}</legend>
    <div className="choice-options">
      {options.map((option) => (
        <label key={option.id} className="choice">
          <input type="radio" name={name} value={option.id} checked={value === option.id} onChange={() => onChange(option.id)} />
          <span className="choice-label">{option.label}</span>
          {option.detail && <span className="choice-detail">{option.detail}</span>}
        </label>
      ))}
    </div>
  </fieldset>
)

const PageSetupForm = ({ page, onApply, onCancel }) => {
  const [draft, setDraft] = useState(page)
  const set = (key) => (value) => setDraft((current) => ({ ...current, [key]: value }))

  return (
    <form
      className="dialog-form"
      onSubmit={(event) => {
        event.preventDefault()
        onApply(draft)
      }}
    >
      <ChoiceGroup legend="Paper size" name="size" options={PAPER_SIZES} value={draft.size} onChange={set('size')} />
      <ChoiceGroup
        legend="Orientation"
        name="orientation"
        options={[
          { id: 'portrait', label: 'Portrait' },
          { id: 'landscape', label: 'Landscape' },
        ]}
        value={draft.orientation}
        onChange={set('orientation')}
      />
      <ChoiceGroup legend="Margins" name="margins" options={MARGIN_PRESETS} value={draft.margins} onChange={set('margins')} />
      <div className="dialog-footer">
        <button type="button" className="button button-quiet" onClick={onCancel}>Cancel</button>
        <button type="submit" className="button button-gold">Apply</button>
      </div>
    </form>
  )
}

const PageSetupDialog = ({ isOpen, page, onApply, onClose }) => (
  <Dialog title="Page setup" isOpen={isOpen} onClose={onClose}>
    <PageSetupForm
      page={page}
      onCancel={onClose}
      onApply={(next) => {
        onApply(next)
        onClose()
      }}
    />
  </Dialog>
)

export default PageSetupDialog
