import { useState, useEffect, useCallback } from 'react'
import {
  getSilverOunces,
  getAverageBuyPriceCad,
  getWealthStocks,
  removeWealthStock,
  getApiKey,
  getPriceCache,
  setPriceCache,
} from '../lib/storage'
import { fetchSilverPrices, fetchStockQuote } from '../lib/api'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'

const RATE_LIMIT_MS = 1200
const CHART_COLORS = ['#0a84ff', '#30d158', '#ff9f0a', '#ff453a', '#bf5af2', '#64d2ff', '#ffd60a']

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

export default function Wealth({ onAddHolding }) {
  const [wealthPrices, setWealthPrices] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stocks, setStocks] = useState([])
  const [silverOz, setSilverOz] = useState(0)
  const [silverAvg, setSilverAvg] = useState(null)

  const refreshHoldings = useCallback(() => {
    setStocks(getWealthStocks())
    setSilverOz(getSilverOunces())
    setSilverAvg(getAverageBuyPriceCad())
  }, [])

  useEffect(() => {
    refreshHoldings()
  }, [refreshHoldings])

  // Hydrate from price cache on mount
  useEffect(() => {
    const cached = getPriceCache()
    if (cached && (silverOz > 0 || stocks.length > 0)) {
      const usdToCad = cached.silverCad / cached.silverUsd
      const next = {
        silverCad: cached.silverCad,
        usdToCad,
        stocks: {},
      }
      setWealthPrices((prev) => ({ ...prev, ...next }))
    }
  }, [silverOz, stocks.length])

  const loadPrices = useCallback(async () => {
    const apiKey = getApiKey()
    if (!apiKey) {
      setError('API key is missing. Add your key in settings.')
      return
    }
    setError(null)
    setLoading(true)
    const next = { silverCad: null, usdToCad: null, stocks: {} }

    try {
      // 1. Silver + FX (fetchSilverPrices does both)
      const silverRes = await fetchSilverPrices(apiKey)
      if (silverRes.error) {
        setError(silverRes.error)
        setLoading(false)
        return
      }
      next.silverCad = silverRes.silverCad
      next.usdToCad = silverRes.silverCad / silverRes.silverUsd
      setPriceCache(silverRes.silverUsd, silverRes.silverCad)

      const stockList = getWealthStocks()
      for (const s of stockList) {
        await new Promise((r) => setTimeout(r, RATE_LIMIT_MS))
        const quoteRes = await fetchStockQuote(apiKey, s.symbol)
        if (!quoteRes.error && quoteRes.priceUsd != null) {
          next.stocks[s.symbol] = quoteRes.priceUsd * next.usdToCad
        }
      }
      setWealthPrices(next)
    } catch (err) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  let usdToCad = wealthPrices?.usdToCad ?? null
  if (usdToCad == null) {
    const cached = getPriceCache()
    usdToCad =
      cached && cached.silverUsd > 0 ? cached.silverCad / cached.silverUsd : null
  }

  const silverValue =
    wealthPrices?.silverCad != null && silverOz > 0 ? silverOz * wealthPrices.silverCad : null
  const silverCost = silverOz > 0 && silverAvg != null ? silverOz * silverAvg : null

  const stockItems = stocks.map((s) => {
    const priceCad = wealthPrices?.stocks?.[s.symbol]
    const value = priceCad != null ? s.shares * priceCad : null
    const avgPriceCad =
      s.priceCurrency === 'USD'
        ? usdToCad != null
          ? s.avgPrice * usdToCad
          : null
        : s.avgPrice
    const cost = avgPriceCad != null ? s.shares * avgPriceCad : null
    return { ...s, value, cost, avgPriceCad }
  })

  const totalValue =
    (silverValue ?? 0) + stockItems.reduce((sum, s) => sum + (s.value ?? 0), 0)
  const totalCost =
    (silverCost ?? 0) + stockItems.reduce((sum, s) => sum + (s.cost ?? 0), 0)
  const totalGrowth = totalCost > 0 ? totalValue - totalCost : null
  const totalGrowthPct =
    totalCost > 0 && totalGrowth != null ? (totalGrowth / totalCost) * 100 : null

  const holdings = []
  if (silverOz > 0) {
    holdings.push({
      id: 'silver',
      name: 'Silver',
      qty: silverOz,
      qtyUnit: 'oz',
      value: silverValue,
      cost: silverCost,
      pricePerUnit: wealthPrices?.silverCad ?? null,
    })
  }
  stockItems.forEach((s) => {
    const priceCad = wealthPrices?.stocks?.[s.symbol]
    holdings.push({
      id: s.id,
      name: s.symbol,
      qty: s.shares,
      qtyUnit: 'shares',
      value: s.value,
      cost: s.cost,
      pricePerUnit: priceCad ?? null,
    })
  })

  const pieData = holdings
    .filter((h) => h.value != null && h.value > 0)
    .map((h) => ({ name: h.name, value: h.value }))

  const hasAnyHoldings = silverOz > 0 || stocks.length > 0

  function handleRemoveStock(id) {
    removeWealthStock(id)
    refreshHoldings()
  }

  return (
    <div className="screen wealth">
      <header className="header">
        <div />
        <h1 className="header-title">Wealth</h1>
        <div />
      </header>

      <div className="content">
        <section className="card wealth-hero">
          <p className="wealth-total">
            {totalValue > 0 ? formatMoney(totalValue, 'CAD') : '—'}
          </p>
          {totalGrowth != null && (
            <p
              className={`wealth-growth ${
                totalGrowth >= 0 ? 'positive' : 'negative'
              }`}
            >
              {formatMoney(totalGrowth, 'CAD')}
              {totalGrowthPct != null && (
                <span className="wealth-growth-pct">
                  {' '}
                  ({totalGrowthPct >= 0 ? '+' : ''}
                  {formatNumber(totalGrowthPct, 1)}%)
                </span>
              )}
            </p>
          )}
        </section>

        {pieData.length > 0 && (
          <section className="card wealth-chart">
            <h2 className="card-label">Allocation</h2>
            <div className="wealth-pie-wrap">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        <section className="card wealth-holdings">
          <div className="edit-purchases-header">
            <h2 className="card-label">Holdings</h2>
            <button
              type="button"
              className="btn-link small"
              onClick={onAddHolding}
            >
              Add holding
            </button>
          </div>

          {!hasAnyHoldings ? (
            <p className="muted small">
              Add a holding or track silver on the Silver tab.
            </p>
          ) : (
            <ul className="wealth-holding-list">
              {holdings.map((h) => {
                const pct =
                  totalValue > 0 && h.value != null
                    ? (h.value / totalValue) * 100
                    : null
                const gain =
                  h.cost != null && h.value != null ? h.value - h.cost : null
                const gainPct =
                  h.cost != null &&
                  h.cost > 0 &&
                  gain != null
                    ? (gain / h.cost) * 100
                    : null
                return (
                  <li key={h.id} className="wealth-holding-row">
                    <div className="wealth-holding-main">
                      <span className="wealth-holding-name">{h.name}</span>
                      <span className="wealth-holding-qty muted">
                        {formatNumber(h.qty)} {h.qtyUnit}
                        {h.pricePerUnit != null && (
                          <span className="wealth-holding-price">
                            {' '}@ {formatMoney(h.pricePerUnit, 'CAD')}/{h.qtyUnit === 'shares' ? 'share' : 'oz'}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="wealth-holding-values">
                      <span className="wealth-holding-value">
                        {h.value != null
                          ? formatMoney(h.value, 'CAD')
                          : '—'}
                      </span>
                      {pct != null && (
                        <span className="muted small">
                          {formatNumber(pct, 1)}%
                        </span>
                      )}
                      {gain != null && (
                        <span
                          className={`wealth-holding-gain ${
                            gain >= 0 ? 'positive' : 'negative'
                          }`}
                        >
                          {formatMoney(gain, 'CAD')}
                          {gainPct != null && (
                            <span>
                              {' '}
                              ({gainPct >= 0 ? '+' : ''}
                              {formatNumber(gainPct, 1)}%)
                            </span>
                          )}
                        </span>
                      )}
                      {h.id !== 'silver' && (
                        <button
                          type="button"
                          className="btn-link small purchase-remove"
                          onClick={() => handleRemoveStock(h.id)}
                          aria-label="Remove"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {error && <p className="error">{error}</p>}

        <button
          type="button"
          className="btn btn-secondary"
          onClick={loadPrices}
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh portfolio'}
        </button>
      </div>
    </div>
  )
}
