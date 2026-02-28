const BASE_URL = 'https://www.alphavantage.co/query'

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
