import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // expose ke local network
    port: 5173,
    https: false, // Gunakan HTTP standar agar http://localhost:5173/ langsung terbuka tanpa ERR_EMPTY_RESPONSE
  },
})
