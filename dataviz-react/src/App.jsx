import React from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CountryPage from './pages/CountryPage'

/**
 * App — Router shell.
 * All page-level logic lives in HomePage and CountryPage.
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/country/:countryName" element={<CountryPage />} />
    </Routes>
  )
}

export default App
