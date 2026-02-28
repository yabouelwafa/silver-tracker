import { useState, useEffect, useCallback } from 'react'
import {
  getSilverOunces,
  getAverageBuyPriceCad,
  getApiKey,
  getPriceCache,
  setPriceCache,
} from '../lib/storage'
import { fetchSilverPrices } from '../lib/api'

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

export default function Home({ onEditHoldings }) {
  const [ounces, setOunces] = useState(0)
  const [buyPrice, setBuyPrice] = useState(null)
  const [silverUsd, setSilverUsd] = useState(null)
  const [silverCad, setSilverCad] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadHoldings = useCallback(() => {
    setOunces(getSilverOunces())
    setBuyPrice(getAverageBuyPriceCad())
  }, [])

  // Restore cached prices on mount only (no API call until user taps Refresh)
  useEffect(() => {
    const cached = getPriceCache()
    if (cached) {
      setSilverUsd(cached.silverUsd)
      setSilverCad(cached.silverCad)
      setLastUpdated(cached.timestamp)
    }
  }, [])

  useEffect(() => {
    loadHoldings()
  }, [loadHoldings])

  const loadPrices = useCallback(async () => {
    const apiKey = getApiKey()
    if (!apiKey) {
      setError('API key is missing. Add your key in settings.')
      return
    }

    setError(null)
    setLoading(true)
    const result = await fetchSilverPrices(apiKey)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      const cached = getPriceCache()
      if (!cached) {
        setSilverUsd(null)
        setSilverCad(null)
      }
      return
    }

    setSilverUsd(result.silverUsd)
    setSilverCad(result.silverCad)
    setLastUpdated(Date.now())
    setPriceCache(result.silverUsd, result.silverCad)
  }, [])

  const totalValueCad = silverCad != null && ounces > 0 ? silverCad * ounces : null
  const avgBuy = buyPrice != null ? buyPrice : null
  const gainLossCad =
    totalValueCad != null && avgBuy != null && ounces > 0
      ? totalValueCad - avgBuy * ounces
      : null
  const gainLossPct =
    gainLossCad != null && avgBuy != null && avgBuy > 0 && ounces > 0
      ? (gainLossCad / (avgBuy * ounces)) * 100
      : null

  return (
    <div className="screen home">
      <header className="header">
        <div />
        <h1 className="header-title">Silver Tracker</h1>
        <div />
      </header>

      <div className="content">
        <section className="card home-hero">
          {(silverCad != null || silverUsd != null) && (
            <p className="home-spot">
              {silverCad != null && `${formatMoney(silverCad, 'CAD')} / oz`}
              {silverCad != null && silverUsd != null && ' · '}
              {silverUsd != null && `${formatMoney(silverUsd, 'USD')} / oz`}
            </p>
          )}
          <p className="home-value">
            {totalValueCad != null ? formatMoney(totalValueCad, 'CAD') : '—'}
          </p>
          {gainLossCad != null ? (
            <p className={`home-gainloss ${gainLossCad >= 0 ? 'positive' : 'negative'}`}>
              {formatMoney(gainLossCad, 'CAD')}
              {gainLossPct != null && (
                <span className="home-gainloss-pct">
                  {' '}({gainLossPct >= 0 ? '+' : ''}{formatNumber(gainLossPct, 1)}%)
                </span>
              )}
            </p>
          ) : (
            ounces > 0 && buyPrice != null && totalValueCad == null && (
              <p className="home-gainloss muted">Tap Refresh to see gain/loss</p>
            )
          )}
        </section>

        <section className="card home-details">
          <p className="home-detail-row">
            <span className="muted">{formatNumber(ounces)} troy oz</span>
            <button type="button" className="btn-link small" onClick={onEditHoldings}>
              Edit holdings
            </button>
          </p>

          {error && <p className="error">{error}</p>}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadPrices}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh prices'}
          </button>

          {lastUpdated && (
            <p className="muted small">Updated {new Date(lastUpdated).toLocaleString()}</p>
          )}
        </section>
      </div>
    </div>
  )
}
