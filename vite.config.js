import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173
    }
  },
  optimizeDeps: {
    include: ['three', 'astronomy-engine', 'three/examples/jsm/controls/OrbitControls'],
    exclude: []
  },
  resolve: {
    dedupe: ['three']
  }
})
