import { useState, useEffect } from 'react'
import Home from './components/Home'
import EditHoldings from './components/EditHoldings'
import AddSilver from './components/AddSilver'
import ApiKeySetup from './components/ApiKeySetup'
import { getApiKey } from './lib/storage'

function App() {
  const [screen, setScreen] = useState('home')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [addSilverReturnTo, setAddSilverReturnTo] = useState('home')

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

  if (screen === 'addSilver') {
    return (
      <AddSilver
        onAdded={() => setScreen(addSilverReturnTo)}
        onCancel={() => setScreen(addSilverReturnTo)}
      />
    )
  }

  if (screen === 'edit') {
    return (
      <EditHoldings
        onSave={() => setScreen('home')}
        onCancel={() => setScreen('home')}
        onAddSilver={() => {
          setAddSilverReturnTo('edit')
          setScreen('addSilver')
        }}
      />
    )
  }

  return (
    <Home
      onEditHoldings={() => setScreen('edit')}
      onAddSilver={() => {
        setAddSilverReturnTo('home')
        setScreen('addSilver')
      }}
    />
  )
}

export default App
