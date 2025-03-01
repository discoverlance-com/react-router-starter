import * as setCookieParser from 'set-cookie-parser'

export const BASE_URL = 'http://localhost:5173'

export function convertSetCookieToCookie(setCookie: string) {
	const parsedCookie = setCookieParser.parseString(setCookie)
	return new URLSearchParams({
		[parsedCookie.name]: parsedCookie.value,
	}).toString()
}
