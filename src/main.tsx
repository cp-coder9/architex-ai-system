import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeAuth } from './store/authStore'

/**
 * AuthInitializer component
 * Initializes Firebase authentication listener on app mount
 */
function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Firebase auth state listener
    const unsubscribe = initializeAuth()
    
    // Cleanup on unmount
    return () => {
      unsubscribe()
    }
  }, [])

  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthInitializer>
      <App />
    </AuthInitializer>
  </StrictMode>,
)
