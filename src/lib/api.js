const BASE_URL = 'https://www.alphavantage.co/query'
const STOCKPRICES_DEV_BASE = 'https://stockprices.dev/api'

const RATE_LIMIT_MS = 1200

/**
 * Try stockprices.dev first (free, no limits). Tries stocks then ETFs.
 * @param {string} symbol
 * @returns {Promise<{ priceUsd: number } | null>} null if not found / invalid
 */
async function fetchStockPriceFromStockPricesDev(symbol) {
  const sym = typeof symbol === 'string' ? symbol.trim().toUpperCase() : ''
  if (!sym) return null
  try {
    for (const type of ['stocks', 'etfs']) {
      const res = await fetch(`${STOCKPRICES_DEV_BASE}/${type}/${encodeURIComponent(sym)}`)
      if (!res.ok) continue
      const data = await res.json()
      const price = data?.Price ?? data?.price
      if (price != null) {
        const priceUsd = parseFloat(price)
        if (Number.isFinite(priceUsd) && priceUsd > 0) return { priceUsd }
      }
    }
  } catch (_) {}
  return null
}

/**
 * Fetch USD to CAD exchange rate.
 * @param {string} apiKey
 * @returns {Promise<{ usdToCad: number } | { error: string }>}
 */
export async function fetchUsdToCad(apiKey) {
  if (!apiKey || !apiKey.trim()) {
    return { error: 'API key is missing.' }
  }
  const key = apiKey.trim()
  try {
    const url = `${BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=CAD&apikey=${encodeURIComponent(key)}`
    const res = await fetch(url)
    const data = await res.json()
    if (data['Information'] || data['Note']) {
      const msg = data['Information'] || data['Note']
      return { error: typeof msg === 'string' ? msg : 'API limit or key error' }
    }
    const rateObj = data['Realtime Currency Exchange Rate']
    if (!rateObj) return { error: 'Invalid API response: missing exchange rate' }
    const rateStr = rateObj['5. Exchange Rate'] ?? rateObj['Exchange Rate']
    if (rateStr == null) return { error: 'Invalid API response: missing exchange rate' }
    const usdToCad = parseFloat(rateStr)
    if (!Number.isFinite(usdToCad) || usdToCad <= 0) return { error: 'Invalid exchange rate' }
    return { usdToCad }
  } catch (err) {
    return { error: err.message || 'Network error' }
  }
}

/**
 * Fetch stock quote (current price in USD) via Alpha Vantage GLOBAL_QUOTE.
 * @param {string} apiKey
 * @param {string} symbol
 * @returns {Promise<{ priceUsd: number } | { error: string }>}
 */
export async function fetchStockQuote(apiKey, symbol) {
  const sym = typeof symbol === 'string' ? symbol.trim().toUpperCase() : ''
  if (!sym) return { error: 'Symbol is required.' }

  // Try stockprices.dev first (free, no limits)
  const stockPricesResult = await fetchStockPriceFromStockPricesDev(sym)
  if (stockPricesResult) return stockPricesResult

  // Fall back to Alpha Vantage
  if (!apiKey || !apiKey.trim()) return { error: 'API key is missing.' }
  const key = apiKey.trim()
  try {
    const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(sym)}&apikey=${encodeURIComponent(key)}`
    const res = await fetch(url)
    const data = await res.json()
    if (data['Information'] || data['Note']) {
      const msg = data['Information'] || data['Note']
      return { error: typeof msg === 'string' ? msg : 'API limit or key error' }
    }
    const quote = data['Global Quote']
    if (!quote) return { error: `No quote for ${sym}` }
    const priceStr = quote['05. price'] ?? quote['price']
    if (priceStr == null) return { error: `No price for ${sym}` }
    const priceUsd = parseFloat(priceStr)
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) return { error: `Invalid price for ${sym}` }
    return { priceUsd }
  } catch (err) {
    return { error: err.message || 'Network error' }
  }
}

/**
 * Fetch silver spot price in USD and CAD using Alpha Vantage.
 * - GOLD_SILVER_SPOT: silver price in USD per troy oz
 * - CURRENCY_EXCHANGE_RATE: USD to CAD for conversion
 * @param {string} apiKey
 * @returns {Promise<{ silverUsd: number, silverCad: number } | { error: string }>}
 */
export async function fetchSilverPrices(apiKey) {
  if (!apiKey || !apiKey.trim()) {
    return { error: 'API key is missing. Please add your Alpha Vantage key in settings.' }
  }

  const key = apiKey.trim()

  try {
    // 1. Silver spot in USD per troy oz
    const spotUrl = `${BASE_URL}?function=GOLD_SILVER_SPOT&symbol=SILVER&apikey=${encodeURIComponent(key)}`
    const spotRes = await fetch(spotUrl)
    const spotData = await spotRes.json()

    if (spotData['Information'] || spotData['Note']) {
      const msg = spotData['Information'] || spotData['Note']
      return { error: typeof msg === 'string' ? msg : 'API limit or key error' }
    }

    const priceStr = spotData?.price
    if (priceStr === undefined || priceStr === null) {
      return { error: 'Invalid API response: missing silver price' }
    }
    const silverUsd = parseFloat(priceStr)
    if (!Number.isFinite(silverUsd) || silverUsd <= 0) {
      return { error: 'Invalid API response: invalid silver price' }
    }

    // Alpha Vantage free tier: max 1 request per second — wait before second call
    await new Promise((r) => setTimeout(r, 1200))

    // 2. USD to CAD rate
    const fxUrl = `${BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=CAD&apikey=${encodeURIComponent(key)}`
    const fxRes = await fetch(fxUrl)
    const fxData = await fxRes.json()

    if (fxData['Information'] || fxData['Note']) {
      const msg = fxData['Information'] || fxData['Note']
      return { error: typeof msg === 'string' ? msg : 'API limit or key error' }
    }

    const rateObj = fxData['Realtime Currency Exchange Rate']
    if (!rateObj) {
      return { error: 'Invalid API response: missing exchange rate' }
    }
    const rateStr = rateObj['5. Exchange Rate'] ?? rateObj['Exchange Rate']
    if (rateStr === undefined || rateStr === null) {
      return { error: 'Invalid API response: missing exchange rate' }
    }
    const usdToCad = parseFloat(rateStr)
    if (!Number.isFinite(usdToCad) || usdToCad <= 0) {
      return { error: 'Invalid API response: invalid exchange rate' }
    }

    const silverCad = silverUsd * usdToCad
    return { silverUsd, silverCad }
  } catch (err) {
    return { error: err.message || 'Network error' }
  }
}
