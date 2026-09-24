import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './ParkRouter.jsx'
import { AccountProvider } from './Account.jsx'
import 'leaflet/dist/leaflet.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AccountProvider><App /></AccountProvider>
  </StrictMode>,
)
