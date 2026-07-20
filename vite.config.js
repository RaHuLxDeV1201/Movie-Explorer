import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Movie-Explorer/', // Must match your exact repository name with slashes!
})