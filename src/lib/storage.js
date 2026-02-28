const KEYS = {
  SILVER_OUNCES: 'silver_ounces',
  AVERAGE_BUY_PRICE_CAD: 'average_buy_price_cad',
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

export function getSilverOunces() {
  const v = get(KEYS.SILVER_OUNCES)
  return typeof v === 'number' && v >= 0 ? v : 0
}

export function setSilverOunces(ounces) {
  const n = Number(ounces)
  if (!Number.isFinite(n) || n < 0) return
  set(KEYS.SILVER_OUNCES, n)
}

export function getAverageBuyPriceCad() {
  const v = get(KEYS.AVERAGE_BUY_PRICE_CAD)
  return typeof v === 'number' && v >= 0 ? v : null
}

export function setAverageBuyPriceCad(price) {
  const n = Number(price)
  if (!Number.isFinite(n) || n < 0) return
  set(KEYS.AVERAGE_BUY_PRICE_CAD, n)
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
