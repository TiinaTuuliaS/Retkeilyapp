import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './ParkRouter.jsx'
import { AccountProvider } from './Account.jsx'
import OfflineStatus from './OfflineStatus.jsx'
import 'leaflet/dist/leaflet.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AccountProvider><OfflineStatus /><App /></AccountProvider>
  </StrictMode>,
)
