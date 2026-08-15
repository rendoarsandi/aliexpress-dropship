import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.output/**', '~/**', '**/.bun/**'],
    environment: 'jsdom',
    globals: true,
    testTimeout: 15000,
  },
  plugins: [
    viteReact(),
  ],
})
