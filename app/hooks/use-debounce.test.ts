// useDebounce.test.js
import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import { beforeAll } from 'vitest'

import { useDebounce } from './use-debounce'

describe('useDebounce', () => {
	beforeAll(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.clearAllTimers()
	})

	afterAll(() => {
		vi.useRealTimers()
	})

	it('should debounce the callback function', () => {
		const mockCallback = vi.fn()
		const { result } = renderHook(
			({ callback, delay }) => useDebounce(callback, delay),
			{ initialProps: { callback: mockCallback, delay: 500 } },
		)

		const debouncedCallback = result.current

		act(() => {
			debouncedCallback('arg1')
			vi.advanceTimersByTime(250)
			debouncedCallback('arg2')
			vi.advanceTimersByTime(250)
			expect(mockCallback).not.toHaveBeenCalled()
		})

		act(() => {
			vi.advanceTimersByTime(500)
			expect(mockCallback).toHaveBeenCalledTimes(1)
			expect(mockCallback).toHaveBeenCalledWith('arg2')
		})
	})

	it('should handle changing callback functions', () => {
		const mockCallback1 = vi.fn()
		const mockCallback2 = vi.fn()
		const { result, rerender } = renderHook(
			({ callback, delay }) => useDebounce(callback, delay),
			{ initialProps: { callback: mockCallback1, delay: 500 } },
		)

		const debouncedCallback = result.current

		act(() => {
			debouncedCallback('arg1')
			vi.advanceTimersByTime(500)
			expect(mockCallback1).toHaveBeenCalledTimes(1)
			expect(mockCallback1).toHaveBeenCalledWith('arg1')
		})

		rerender({ callback: mockCallback2, delay: 500 })

		act(() => {
			debouncedCallback('arg2')
			vi.advanceTimersByTime(500)
			expect(mockCallback2).toHaveBeenCalledTimes(1)
			expect(mockCallback2).toHaveBeenCalledWith('arg2')
			expect(mockCallback1).toHaveBeenCalledTimes(1)
		})
	})

	it('should handle changing delays', () => {
		const mockCallback = vi.fn()
		const { result, rerender } = renderHook(
			({ callback, delay }) => useDebounce(callback, delay),
			{ initialProps: { callback: mockCallback, delay: 500 } },
		)

		const debouncedCallback = result.current

		act(() => {
			debouncedCallback('arg1')
			vi.advanceTimersByTime(250)
			rerender({ callback: mockCallback, delay: 1000 }) // delay changed here
			debouncedCallback('arg2')
			vi.advanceTimersByTime(250) // advance 250 more. Total 500 after first call, and 250 after second.
			expect(mockCallback).not.toHaveBeenCalled()
		})

		act(() => {
			vi.advanceTimersByTime(750) // Advance the remaining 750ms to reach the new 1000ms delay.
			expect(mockCallback).toHaveBeenCalledTimes(1)
			expect(mockCallback).toHaveBeenCalledWith('arg2')
		})
	})
})
