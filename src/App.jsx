import { useState, useEffect } from 'react'
import Home from './components/Home'
import EditHoldings from './components/EditHoldings'
import AddSilver from './components/AddSilver'
import Wealth from './components/Wealth'
import AddWealthHolding from './components/AddWealthHolding'
import ApiKeySetup from './components/ApiKeySetup'
import { getApiKey } from './lib/storage'

function App() {
  const [activeTab, setActiveTab] = useState('silver')
  const [screen, setScreen] = useState('home')
  const [wealthScreen, setWealthScreen] = useState('list')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [addSilverReturnTo, setAddSilverReturnTo] = useState('home')

  useEffect(() => {
    setHasApiKey(!!getApiKey())
  }, [screen, wealthScreen, activeTab])

  if (!hasApiKey && activeTab === 'silver' && screen === 'home') {
    return (
      <ApiKeySetup
        onDone={() => {
          setHasApiKey(true)
        }}
      />
    )
  }

  function renderContent() {
    if (activeTab === 'wealth') {
      if (wealthScreen === 'add') {
        return (
          <AddWealthHolding
            onDone={() => setWealthScreen('list')}
            onCancel={() => setWealthScreen('list')}
          />
        )
      }
      return <Wealth onAddHolding={() => setWealthScreen('add')} />
    }

    if (activeTab === 'silver') {
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

    return null
  }

  const showTabBar = hasApiKey

  return (
    <div className="app">
      <div className="app-content">{renderContent()}</div>
      {showTabBar && (
        <nav className="tab-bar">
          <button
            type="button"
            className={`tab-bar-item ${activeTab === 'silver' ? 'active' : ''}`}
            onClick={() => setActiveTab('silver')}
          >
            Silver
          </button>
          <button
            type="button"
            className={`tab-bar-item ${activeTab === 'wealth' ? 'active' : ''}`}
            onClick={() => setActiveTab('wealth')}
          >
            Wealth
          </button>
        </nav>
      )}
    </div>
  )
}

export default App
