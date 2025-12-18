import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      "c2246809bc32.ngrok-free.app",
    ],
    // optional but often needed with tunnels:
    host: true,     // or '0.0.0.0'
    // port: 5173,  // or whatever you use
  },
})
