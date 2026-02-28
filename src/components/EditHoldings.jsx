import { useState, useEffect } from 'react'
import { getSilverOunces, setSilverOunces, getAverageBuyPriceCad, setAverageBuyPriceCad } from '../lib/storage'

export default function EditHoldings({ onSave, onCancel }) {
  const [ounces, setOunces] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setOunces(String(getSilverOunces() || ''))
    const price = getAverageBuyPriceCad()
    setBuyPrice(price !== null ? String(price) : '')
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const oz = parseFloat(ounces)
    const price = buyPrice.trim() === '' ? null : parseFloat(buyPrice)
    const newErrors = {}

    if (Number.isNaN(oz) || oz < 0) newErrors.ounces = 'Enter a valid amount (≥ 0).'
    if (buyPrice.trim() !== '' && (Number.isNaN(price) || price < 0)) newErrors.buyPrice = 'Enter a valid price (≥ 0).'

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setSilverOunces(oz)
    if (price !== null) setAverageBuyPriceCad(price)
    onSave()
  }

  return (
    <div className="screen edit-holdings">
      <header className="header">
        <button type="button" className="btn-link" onClick={onCancel}>
          Cancel
        </button>
        <h1 className="header-title">Edit holdings</h1>
        <button type="submit" form="edit-holdings-form" className="btn-link">
          Save
        </button>
      </header>
      <form id="edit-holdings-form" onSubmit={handleSubmit} className="form card">
        <label className="label">
          Total silver (troy oz)
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            placeholder="0"
            value={ounces}
            onChange={(e) => setOunces(e.target.value)}
            className="input"
          />
          {errors.ounces && <span className="field-error">{errors.ounces}</span>}
        </label>
        <label className="label">
          Average buy price (CAD per troy oz)
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            placeholder="Optional"
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            className="input"
          />
          {errors.buyPrice && <span className="field-error">{errors.buyPrice}</span>}
          <span className="hint">Leave blank if you don’t want gain/loss calculated.</span>
        </label>
        <button type="submit" className="btn btn-primary">
          Save
        </button>
      </form>
    </div>
  )
}
