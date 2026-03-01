import { useState } from 'react'
import { addWealthStock } from '../lib/storage'

export default function AddWealthHolding({ onDone, onCancel }) {
  const [symbol, setSymbol] = useState('')
  const [shares, setShares] = useState('')
  const [avgPrice, setAvgPrice] = useState('')
  const [priceCurrency, setPriceCurrency] = useState('CAD')
  const [errors, setErrors] = useState({})

  function handleSubmit(e) {
    e.preventDefault()
    const sym = symbol.trim().toUpperCase()
    const sh = parseFloat(shares)
    const avg = parseFloat(avgPrice)
    const newErrors = {}

    if (!sym) newErrors.symbol = 'Enter a stock symbol (e.g. AAPL).'
    if (Number.isNaN(sh) || sh <= 0) newErrors.shares = 'Enter a valid number of shares.'
    if (Number.isNaN(avg) || avg < 0) newErrors.avgPrice = 'Enter a valid average price (≥ 0).'

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    addWealthStock(sym, sh, avg, priceCurrency)
    onDone()
  }

  return (
    <div className="screen add-wealth-holding">
      <header className="header">
        <button type="button" className="btn-link" onClick={onCancel}>
          Cancel
        </button>
        <h1 className="header-title">Add holding</h1>
        <div />
      </header>
      <form onSubmit={handleSubmit} className="form card">
        <label className="label">
          Symbol
          <input
            type="text"
            inputMode="text"
            placeholder="e.g. AAPL"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="input"
            autoCapitalize="characters"
          />
          {errors.symbol && <span className="field-error">{errors.symbol}</span>}
        </label>
        <label className="label">
          Shares
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            placeholder="e.g. 10"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            className="input"
          />
          {errors.shares && <span className="field-error">{errors.shares}</span>}
        </label>
        <label className="label">
          Average price per share
          <div className="input-with-select">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="e.g. 150.00"
              value={avgPrice}
              onChange={(e) => setAvgPrice(e.target.value)}
              className="input"
            />
            <select
              value={priceCurrency}
              onChange={(e) => setPriceCurrency(e.target.value)}
              className="input input-currency"
              aria-label="Price currency"
            >
              <option value="CAD">CAD</option>
              <option value="USD">USD</option>
            </select>
          </div>
          {errors.avgPrice && <span className="field-error">{errors.avgPrice}</span>}
        </label>
        <button type="submit" className="btn btn-primary">
          Add holding
        </button>
      </form>
    </div>
  )
}
