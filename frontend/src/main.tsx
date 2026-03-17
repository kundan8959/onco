import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import App from './App'
import { GlobalLoaderProvider } from './context/GlobalLoaderContext'
import { store } from './store'

// Apply saved theme immediately — prevents flash on load
try {
 const saved = localStorage.getItem('oncocare-theme') || 'nebula';
 document.documentElement.setAttribute('data-theme', saved);
} catch {}

createRoot(document.getElementById('root')!).render(
 <StrictMode>
 <Provider store={store}>
 <GlobalLoaderProvider>
 <App />
 </GlobalLoaderProvider>
 </Provider>
 </StrictMode>,
)
