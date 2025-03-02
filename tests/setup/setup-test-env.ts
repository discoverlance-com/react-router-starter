// sort-imports-ignore

import 'dotenv/config'

import '@/utils/env.server'

import 'vitest-browser-react'

// we need these to be imported first 👆
import { afterEach, beforeEach, type MockInstance, vi } from 'vitest'

import { server } from '../mocks'
import './custom-matchers'

afterEach(() => server.resetHandlers())

export let consoleError: MockInstance<(typeof console)['error']>

beforeEach(() => {
	const originalConsoleError = console.error
	consoleError = vi.spyOn(console, 'error')
	consoleError.mockImplementation(
		(...args: Parameters<typeof console.error>) => {
			originalConsoleError(...args)
			throw new Error(
				'Console error was called. Call consoleError.mockImplementation(() => {}) if this is expected.',
			)
		},
	)
})
