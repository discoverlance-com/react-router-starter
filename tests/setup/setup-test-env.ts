// sort-imports-ignore

import 'dotenv/config'

import { cleanup } from '@testing-library/react'

// we need these to be imported first 👆
import { afterEach, beforeEach, type MockInstance, vi } from 'vitest'

import { server } from '../mocks'
import './custom-matchers'

afterEach(() => server.resetHandlers())
afterEach(() => cleanup())

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
