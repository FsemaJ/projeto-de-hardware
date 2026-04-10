import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Isso libera o acesso pela rede!
    port: 5173  // (Opcional) Força a rodar nesta porta
  }
})