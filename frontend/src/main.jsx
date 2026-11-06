import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './ParkRouter.jsx'
import { AccountProvider } from './Account.jsx'
import OfflineStatus from './OfflineStatus.jsx'
import 'leaflet/dist/leaflet.css';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // Switching back to development must not leave the old production shell active.
  navigator.serviceWorker.getRegistrations().then(async registrations => {
    const ours = registrations.filter(r => r.active?.scriptURL === new URL('/sw.js', location.origin).href);
    for (const r of ours) await r.unregister();
    if (ours.length && navigator.serviceWorker.controller) location.reload();
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AccountProvider><OfflineStatus /><App /></AccountProvider>
  </StrictMode>,
)
