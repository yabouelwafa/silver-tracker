const KEYS = {
  SILVER_OUNCES: 'silver_ounces',
  AVERAGE_BUY_PRICE_CAD: 'average_buy_price_cad',
  SILVER_PURCHASES: 'silver_purchases',
  WEALTH_STOCKS: 'wealth_stocks',
  ALPHAVANTAGE_API_KEY: 'alphavantage_api_key',
  PRICE_CACHE: 'silver_tracker_price_cache',
  PRICE_CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes
}

function get(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return defaultValue
    const parsed = JSON.parse(raw)
    return parsed
  } catch {
    return defaultValue
  }
}

function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('localStorage set failed', e)
  }
}

function migrateFromLegacyIfNeeded() {
  const purchases = get(KEYS.SILVER_PURCHASES)
  if (Array.isArray(purchases) && purchases.length > 0) return purchases
  const oz = get(KEYS.SILVER_OUNCES)
  const price = get(KEYS.AVERAGE_BUY_PRICE_CAD)
  const legacyOz = typeof oz === 'number' && oz >= 0 ? oz : 0
  const legacyPrice = typeof price === 'number' && price >= 0 ? price : null
  if (legacyOz > 0 && legacyPrice != null) {
    const migrated = [{ id: 'legacy', ounces: legacyOz, pricePerOzCad: legacyPrice }]
    set(KEYS.SILVER_PURCHASES, migrated)
    try {
      localStorage.removeItem(KEYS.SILVER_OUNCES)
      localStorage.removeItem(KEYS.AVERAGE_BUY_PRICE_CAD)
    } catch (_) {}
    return migrated
  }
  return Array.isArray(purchases) ? purchases : []
}

export function getPurchases() {
  const list = migrateFromLegacyIfNeeded()
  return list.map((p) => ({
    id: p.id ?? String(Date.now()),
    ounces: typeof p.ounces === 'number' && p.ounces >= 0 ? p.ounces : 0,
    pricePerOzCad: typeof p.pricePerOzCad === 'number' && p.pricePerOzCad >= 0 ? p.pricePerOzCad : 0,
  }))
}

export function addPurchase(ounces, pricePerOzCad) {
  const oz = Number(ounces)
  const price = Number(pricePerOzCad)
  if (!Number.isFinite(oz) || oz <= 0 || !Number.isFinite(price) || price < 0) return
  const list = getPurchases()
  list.push({ id: String(Date.now()), ounces: oz, pricePerOzCad: price })
  set(KEYS.SILVER_PURCHASES, list)
}

export function removePurchase(id) {
  const list = getPurchases().filter((p) => p.id !== id)
  set(KEYS.SILVER_PURCHASES, list)
}

export function getSilverOunces() {
  const list = getPurchases()
  return list.reduce((sum, p) => sum + p.ounces, 0)
}

export function setSilverOunces(ounces) {
  const n = Number(ounces)
  if (!Number.isFinite(n) || n < 0) return
  const list = getPurchases()
  if (list.length === 0) {
    if (n > 0) set(KEYS.SILVER_PURCHASES, [{ id: String(Date.now()), ounces: n, pricePerOzCad: 0 }])
    return
  }
  const total = list.reduce((s, p) => s + p.ounces, 0)
  const avg = list.reduce((s, p) => s + p.ounces * p.pricePerOzCad, 0) / total
  set(KEYS.SILVER_PURCHASES, [{ id: String(Date.now()), ounces: n, pricePerOzCad: Number.isFinite(avg) ? avg : 0 }])
}

export function getAverageBuyPriceCad() {
  const list = getPurchases()
  const totalOz = list.reduce((sum, p) => sum + p.ounces, 0)
  if (totalOz <= 0) return null
  const totalCost = list.reduce((sum, p) => sum + p.ounces * p.pricePerOzCad, 0)
  return totalCost / totalOz
}

export function setAverageBuyPriceCad(price) {
  const n = Number(price)
  if (!Number.isFinite(n) || n < 0) return
  const list = getPurchases()
  if (list.length === 0) return
  const totalOz = list.reduce((s, p) => s + p.ounces, 0)
  if (totalOz <= 0) return
  set(KEYS.SILVER_PURCHASES, list.map((p) => ({ ...p, pricePerOzCad: n })))
}

export function getApiKey() {
  const v = localStorage.getItem(KEYS.ALPHAVANTAGE_API_KEY)
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

export function setApiKey(key) {
  if (typeof key !== 'string' || !key.trim()) return
  localStorage.setItem(KEYS.ALPHAVANTAGE_API_KEY, key.trim())
}

export function getPriceCache() {
  const cached = get(KEYS.PRICE_CACHE)
  if (!cached || typeof cached.silverUsd !== 'number' || typeof cached.silverCad !== 'number') return null
  if (Date.now() - (cached.timestamp || 0) > KEYS.PRICE_CACHE_TTL_MS) return null
  return { silverUsd: cached.silverUsd, silverCad: cached.silverCad, timestamp: cached.timestamp }
}

export function setPriceCache(silverUsd, silverCad) {
  set(KEYS.PRICE_CACHE, {
    silverUsd,
    silverCad,
    timestamp: Date.now(),
  })
}

// Wealth / stock holdings
export function getWealthStocks() {
  const raw = get(KEYS.WEALTH_STOCKS)
  if (!Array.isArray(raw)) return []
  return raw
    .filter((s) => s && typeof s.symbol === 'string' && s.symbol.trim())
    .map((s) => {
      const currency = s.priceCurrency === 'USD' ? 'USD' : 'CAD'
      const avgPrice = typeof s.avgPrice === 'number' && s.avgPrice >= 0
        ? s.avgPrice
        : (typeof s.avgPriceCad === 'number' && s.avgPriceCad >= 0 ? s.avgPriceCad : 0)
      return {
        id: s.id ?? String(Date.now()),
        symbol: String(s.symbol).trim().toUpperCase(),
        shares: typeof s.shares === 'number' && s.shares > 0 ? s.shares : 0,
        avgPrice,
        priceCurrency: currency,
      }
    })
    .filter((s) => s.shares > 0)
}

export function addWealthStock(symbol, shares, avgPrice, priceCurrency = 'CAD') {
  const sym = typeof symbol === 'string' ? symbol.trim().toUpperCase() : ''
  const sh = Number(shares)
  const avg = Number(avgPrice)
  const currency = priceCurrency === 'USD' ? 'USD' : 'CAD'
  if (!sym || !Number.isFinite(sh) || sh <= 0 || !Number.isFinite(avg) || avg < 0) return
  const list = getWealthStocks()
  list.push({ id: String(Date.now()), symbol: sym, shares: sh, avgPrice: avg, priceCurrency: currency })
  set(KEYS.WEALTH_STOCKS, list)
}

export function removeWealthStock(id) {
  const list = getWealthStocks().filter((s) => s.id !== id)
  set(KEYS.WEALTH_STOCKS, list)
}
