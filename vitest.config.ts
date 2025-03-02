import {
	configDefaults,
	defineConfig,
	defineWorkspace,
	mergeConfig,
} from 'vitest/config'

import viteConfig from './vite.config'

const browserConfig = mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			exclude: [...configDefaults.exclude],
			include: [
				'./app/tests/browser/**/*.{test}.ts',
				'./app/**/*.browser.test.{ts,tsx}',
			],
			setupFiles: ['./tests/setup/setup-test-env.ts'],
			globalSetup: ['./tests/setup/global-setup.ts'],
			restoreMocks: true,
			coverage: {
				include: ['app/**/*.{ts,tsx}'],
				all: true,
			},
			name: 'browser',
			browser: {
				enabled: true,
				provider: 'playwright',
				instances: [{ browser: 'chromium' }],
			},
		},
	}),
)

const nodeConfig = mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			exclude: [...configDefaults.exclude],
			include: [
				'./app/tests/unit/**/*.{test}.ts',
				'./app/**/*.unit.test.{ts,tsx}',
			],
			setupFiles: ['./tests/setup/setup-test-env.ts'],
			globalSetup: ['./tests/setup/global-setup.ts'],
			restoreMocks: true,
			coverage: {
				include: ['app/**/*.{ts,tsx}'],
				all: true,
			},
			name: 'unit',
			environment: 'node',
		},
	}),
)

export default defineWorkspace([browserConfig, nodeConfig])
