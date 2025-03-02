import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
	plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
	server: {
		watch: {
			ignored: ['**/playwright-report/**'],
		},
		hmr: {
			// clientPort: 443,
			protocol: 'ws',
			port: 24678,
		},
		cors: true,
	},
})
