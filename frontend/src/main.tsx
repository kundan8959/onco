import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import './theme-premium.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import App from './App'
import { GlobalLoaderProvider } from './context/GlobalLoaderContext'
import { store } from './store'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <GlobalLoaderProvider>
        <App />
      </GlobalLoaderProvider>
    </Provider>
  </StrictMode>,
)
