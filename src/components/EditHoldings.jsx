import { useState, useEffect, useCallback } from 'react'
import {
  getPurchases,
  removePurchase,
  getSilverOunces,
  getAverageBuyPriceCad,
} from '../lib/storage'

function formatMoney(value, currency = 'CAD') {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatNumber(n, decimals = 2) {
  return new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

export default function EditHoldings({ onSave, onCancel, onAddSilver }) {
  const [purchases, setPurchases] = useState([])

  const refresh = useCallback(() => {
    setPurchases(getPurchases())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const totalOz = getSilverOunces()
  const avgPrice = getAverageBuyPriceCad()

  function handleRemove(id) {
    removePurchase(id)
    refresh()
  }

  return (
    <div className="screen edit-holdings">
      <header className="header">
        <button type="button" className="btn-link" onClick={onCancel}>
          Cancel
        </button>
        <h1 className="header-title">Edit holdings</h1>
        <button type="button" className="btn-link" onClick={onSave}>
          Done
        </button>
      </header>

      <div className="content">
        <section className="card edit-summary">
          <p className="edit-summary-row">
            <span className="muted">Total</span>
            <span className="edit-summary-value">{formatNumber(totalOz)} troy oz</span>
          </p>
          {avgPrice != null && (
            <p className="edit-summary-row">
              <span className="muted">Average buy price</span>
              <span className="edit-summary-value">{formatMoney(avgPrice, 'CAD')} / oz</span>
            </p>
          )}
        </section>

        <section className="card edit-purchases">
          <div className="edit-purchases-header">
            <h2 className="card-label">Purchases</h2>
            <button type="button" className="btn-link small" onClick={onAddSilver}>
              Add silver
            </button>
          </div>
          {purchases.length === 0 ? (
            <p className="muted small">No purchases yet. Tap “Add silver” to record a purchase.</p>
          ) : (
            <ul className="purchase-list">
              {purchases.map((p) => (
                <li key={p.id} className="purchase-item">
                  <span className="purchase-desc">
                    {formatNumber(p.ounces)} oz @ {formatMoney(p.pricePerOzCad, 'CAD')}/oz
                  </span>
                  <button
                    type="button"
                    className="btn-link small purchase-remove"
                    onClick={() => handleRemove(p.id)}
                    aria-label="Remove"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
