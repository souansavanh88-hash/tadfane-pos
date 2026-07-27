import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './utils/LanguageContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Wrapper that signals React has truly mounted and removes the HTML loading screen
function AppWithMountSignal() {
  useEffect(() => {
    // Mark React as successfully mounted
    window.__REACT_MOUNTED__ = true;
    // Remove the static HTML loading screen if still present
    const loader = document.getElementById('html-loader');
    if (loader) {
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 300);
    }
  }, []);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWithMountSignal />
  </StrictMode>
)
