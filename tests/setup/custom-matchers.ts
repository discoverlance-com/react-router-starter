import '@testing-library/jest-dom/vitest'
import * as setCookieParser from 'set-cookie-parser'
import { expect } from 'vitest'

import { type ToastInput } from '@/lib/cookies/cookies-schema'
import { toastKey, toastSessionStorage } from '@/lib/cookies/toast.server'
import { convertSetCookieToCookie } from '@/tests/utils'

expect.extend({
	toHaveRedirect(response: unknown, redirectTo?: string) {
		if (!(response instanceof Response)) {
			throw new Error('toHaveRedirect must be called with a Response')
		}
		const location = response.headers.get('location')
		const redirectToSupplied = redirectTo !== undefined
		if (redirectToSupplied !== Boolean(location)) {
			return {
				pass: Boolean(location),
				message: () =>
					`Expected response to ${this.isNot ? 'not ' : ''}redirect${
						redirectToSupplied
							? ` to ${this.utils.printExpected(redirectTo)}`
							: ''
					} but got ${
						location ? 'no redirect' : this.utils.printReceived(location)
					}`,
			}
		}
		const isRedirectStatusCode = response.status >= 300 && response.status < 400
		if (!isRedirectStatusCode) {
			return {
				pass: false,
				message: () =>
					`Expected redirect to ${
						this.isNot ? 'not ' : ''
					}be ${this.utils.printExpected(
						'>= 300 && < 400',
					)} but got ${this.utils.printReceived(response.status)}`,
			}
		}

		function toUrl(s?: string | null) {
			s ??= ''
			return s.startsWith('http')
				? new URL(s)
				: new URL(s, 'https://example.com')
		}

		function urlsMatch(u1: URL, u2: URL) {
			const u1SP = new URL(u1).searchParams
			u1SP.sort()
			const u2SP = new URL(u2).searchParams
			u2SP.sort()
			return (
				u1.origin === u2.origin &&
				u1.pathname === u2.pathname &&
				u1SP.toString() === u2SP.toString() &&
				u1.hash === u2.hash
			)
		}

		return {
			pass:
				location == redirectTo || urlsMatch(toUrl(location), toUrl(redirectTo)),
			message: () =>
				`Expected response to ${
					this.isNot ? 'not ' : ''
				}redirect to ${this.utils.printExpected(
					redirectTo,
				)} but got ${this.utils.printReceived(location)}`,
		}
	},
	async toSendToast(response: Response, toast: ToastInput) {
		const setCookies = response.headers.getSetCookie()
		const toastSetCookie = setCookies.find(
			(c) => setCookieParser.parseString(c).name === 'en_toast',
		)

		if (!toastSetCookie) {
			return {
				pass: false,
				message: () =>
					`en_toast set-cookie header was${this.isNot ? '' : ' not'} defined`,
			}
		}

		const toastSession = await toastSessionStorage.getSession(
			convertSetCookieToCookie(toastSetCookie),
		)
		const toastValue = toastSession.get(toastKey)

		if (!toastValue) {
			return {
				pass: false,
				message: () => `toast was${this.isNot ? '' : ' not'} set in session`,
			}
		}

		const pass = this.equals(toastValue, toast)

		const diff = pass ? null : `\n${this.utils.diff(toastValue, toast)}`

		return {
			pass,
			message: () =>
				`toast in the response ${
					this.isNot ? 'does not match' : 'matches'
				} the expected toast${diff}`,
		}
	},
})

interface CustomMatchers<R = unknown> {
	toHaveRedirect(redirectTo: string | null): R
	toHaveSessionForUser(userId: string): Promise<R>
	toSendToast(toast: ToastInput): Promise<R>
}

declare module 'vitest' {
	interface Assertion<T = any> extends CustomMatchers<T> {}
	interface AsymmetricMatchersContaining extends CustomMatchers {}
}
