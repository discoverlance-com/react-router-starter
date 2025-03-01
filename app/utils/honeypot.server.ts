import { Honeypot, SpamError } from 'remix-utils/honeypot/server'

import { env } from './env.server'

export const honeypot = new Honeypot({
	validFromFieldName: env.NODE_ENV === 'test' ? null : undefined,
	encryptionSeed: env.HONEYPOT_SECRET,
})

export function checkHoneypot(formData: FormData) {
	try {
		honeypot.check(formData)
	} catch (error) {
		if (error instanceof SpamError) {
			throw new Response('Form not submitted properly', { status: 400 })
		}
		throw error
	}
}
