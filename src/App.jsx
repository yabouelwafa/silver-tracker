import { useState, useEffect } from 'react'
import Home from './components/Home'
import EditHoldings from './components/EditHoldings'
import ApiKeySetup from './components/ApiKeySetup'
import { getApiKey } from './lib/storage'

function App() {
  const [screen, setScreen] = useState('home')
  const [hasApiKey, setHasApiKey] = useState(false)

  useEffect(() => {
    setHasApiKey(!!getApiKey())
  }, [screen])

  if (!hasApiKey && screen === 'home') {
    return (
      <ApiKeySetup
        onDone={() => {
          setHasApiKey(true)
        }}
      />
    )
  }

  if (screen === 'edit') {
    return (
      <EditHoldings
        onSave={() => setScreen('home')}
        onCancel={() => setScreen('home')}
      />
    )
  }

  return (
    <Home
      onEditHoldings={() => setScreen('edit')}
    />
  )
}

export default App
