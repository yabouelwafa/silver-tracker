import { useState } from 'react'
import { addPurchase } from '../lib/storage'

export default function AddSilver({ onAdded, onCancel }) {
  const [ounces, setOunces] = useState('')
  const [pricePerOz, setPricePerOz] = useState('')
  const [errors, setErrors] = useState({})

  function handleSubmit(e) {
    e.preventDefault()
    const oz = parseFloat(ounces)
    const price = parseFloat(pricePerOz)
    const newErrors = {}

    if (Number.isNaN(oz) || oz <= 0) newErrors.ounces = 'Enter a valid amount (e.g. 10).'
    if (Number.isNaN(price) || price < 0) newErrors.pricePerOz = 'Enter a valid price per oz (≥ 0).'

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    addPurchase(oz, price)
    onAdded()
  }

  return (
    <div className="screen add-silver">
      <header className="header">
        <button type="button" className="btn-link" onClick={onCancel}>
          Cancel
        </button>
        <h1 className="header-title">Add silver</h1>
        <div />
      </header>
      <form onSubmit={handleSubmit} className="form card">
        <label className="label">
          Amount (troy oz)
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            placeholder="e.g. 10"
            value={ounces}
            onChange={(e) => setOunces(e.target.value)}
            className="input"
          />
          {errors.ounces && <span className="field-error">{errors.ounces}</span>}
        </label>
        <label className="label">
          Price paid per oz (CAD)
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            placeholder="e.g. 28.50"
            value={pricePerOz}
            onChange={(e) => setPricePerOz(e.target.value)}
            className="input"
          />
          {errors.pricePerOz && <span className="field-error">{errors.pricePerOz}</span>}
          <span className="hint">Your average buy price will update automatically.</span>
        </label>
        <button type="submit" className="btn btn-primary">
          Add silver
        </button>
      </form>
    </div>
  )
}
