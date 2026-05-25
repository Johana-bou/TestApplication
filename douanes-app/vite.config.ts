import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',  // ← essentiel pour Electron
  plugins: [react()],
})
