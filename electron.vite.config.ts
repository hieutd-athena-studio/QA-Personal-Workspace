import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

const rendererRoot = resolve(__dirname, 'src/renderer/src')

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': rendererRoot,
        '@shared': resolve(__dirname, 'src/shared')
      }
    },
    plugins: [
      TanStackRouterVite({
        routesDirectory: resolve(rendererRoot, 'routes'),
        generatedRouteTree: resolve(rendererRoot, 'routeTree.gen.ts'),
        target: 'react'
      }),
      react(),
      tailwindcss()
    ]
  }
})
