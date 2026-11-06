import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import offlineShell from './offline-shell-plugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), offlineShell()],
  preview: { port: 5173, strictPort: true },
})
