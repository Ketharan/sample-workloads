import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Minimal local declaration so this config type-checks without adding @types/node
// as a dependency just to read one build-time variable.
declare const process: { env: Record<string, string | undefined> }

// Serving under a path prefix (e.g. an OpenChoreo endpoint route such as
// /doclet-frontend-webapp) requires the asset URLs to carry that prefix, otherwise
// index.html requests /assets/... at the gateway root and the app renders blank.
// Set VITE_BASE_PATH at build time; defaults to / for local dev and compose.
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
  server: {
    port: 5173,
  },
})
