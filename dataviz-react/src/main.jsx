import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import App from './App.jsx'
import './index.css'
import './App.css'

/**
 * ScrollToTop — scrolls to top on every route change (not hash changes).
 * Placed inside BrowserRouter so useLocation works.
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    // Don't scroll to top if there's a hash (e.g. /#geomap) — let the page handle it
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname, hash]);
  return null;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <DataProvider>
        <App />
      </DataProvider>
    </BrowserRouter>
  </StrictMode>,
)

