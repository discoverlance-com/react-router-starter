import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { type ViteUserConfig } from 'vitest/config'

export default {
	plugins: [
		//@ts-expect-error it works well just the plugins type error with vitest types
		tailwindcss(),
		//@ts-expect-error it works well just the plugins type error with vitest types
		process.env.NODE_ENV === 'test' ? null : reactRouter(),
		//@ts-expect-error it works well just the plugins type error with vitest types
		tsconfigPaths(),
	],
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
	test: {
		environment: 'jsdom',
		include: ['./app/**/*.test.{ts,tsx}'],
		setupFiles: ['./tests/setup/setup-test-env.ts'],
		globalSetup: ['./tests/setup/global-setup.ts'],
		restoreMocks: true,
		coverage: {
			include: ['app/**/*.{ts,tsx}'],
			all: true,
		},
	},
} satisfies ViteUserConfig
