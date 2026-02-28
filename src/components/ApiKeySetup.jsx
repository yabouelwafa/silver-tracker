import { useState } from 'react'
import { setApiKey } from '../lib/storage'

export default function ApiKeySetup({ onDone }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const trimmed = key.trim()
    if (!trimmed) {
      setError('Please enter your API key.')
      return
    }
    setApiKey(trimmed)
    onDone()
  }

  return (
    <div className="screen api-key-setup">
      <div className="card">
        <h1 className="title">Alpha Vantage API Key</h1>
        <p className="text">
          Get a free API key at{' '}
          <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer">
            alphavantage.co
          </a>
          . Enter it below to load live silver spot prices (CAD & USD). It is stored only on this device.
        </p>
        <form onSubmit={handleSubmit} className="form">
          <input
            type="password"
            autoComplete="off"
            placeholder="Your API key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="input"
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary">
            Save and continue
          </button>
        </form>
      </div>
    </div>
  )
}
