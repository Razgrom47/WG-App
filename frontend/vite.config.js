import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0", // This line exposes your app to the local network.
    port: 9000,
    open: true, // This is optional. It'll automatically open the app in the browser.
    allowedHosts: true,
    cors: true,
  },
})
