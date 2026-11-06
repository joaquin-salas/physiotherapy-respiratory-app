import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Lets you import with "@/..." instead of long relative paths (configured in tsconfig.json)
    tsconfigPaths: true,
  },
  server: {
    proxy: {
      // Forward API calls to NestJS, so the browser only talks to one origin (no CORS)
      '/api': 'http://localhost:3000',
    },
  },
})
