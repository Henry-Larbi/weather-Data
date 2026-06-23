import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Pyodide is loaded at runtime from a CDN (see src/lib/pyodide.ts), so it is
// intentionally NOT bundled here. Everything else is a normal Vite SPA.
export default defineConfig({
  plugins: [react()],
})
