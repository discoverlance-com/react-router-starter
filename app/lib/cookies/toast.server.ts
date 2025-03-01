import { createCookieSessionStorage, redirect } from 'react-router'
import { z } from 'zod'

import { env } from '@/utils/env.server'
import { combineHeaders } from '@/utils/misc'

export const toastKey = 'toast'

const ToastSchema = z.object({
	description: z.string(),
	id: z.string().default(() => crypto.randomUUID()),
	title: z.string().optional(),
	type: z.enum(['info', 'success', 'error', 'warning']).default('info'),
	position: z
		.enum([
			'top-right',
			'top-center',
			'top-left',
			'bottom-right',
			'bottom-center',
			'bottom-left',
		])
		.default('top-right'),
})

export type Toast = z.infer<typeof ToastSchema>
export type ToastInput = z.input<typeof ToastSchema>

export const toastSessionStorage = createCookieSessionStorage({
	cookie: {
		name: 'en_toast',
		sameSite: 'lax',
		path: '/',
		httpOnly: true,
		secrets: [env.SESSION_SECRET],
		secure: env.USE_SECURE_COOKIES,
	},
})

export async function redirectWithToast(
	url: string,
	toast: ToastInput,
	init?: ResponseInit,
) {
	return redirect(url, {
		...init,
		headers: combineHeaders(init?.headers, await createToastHeaders(toast)),
	})
}

export async function createToastHeaders(toastInput: ToastInput) {
	const session = await toastSessionStorage.getSession()
	const toast = ToastSchema.parse(toastInput)
	session.flash(toastKey, toast)
	const cookie = await toastSessionStorage.commitSession(session)
	return new Headers({ 'set-cookie': cookie })
}

export async function getToast(request: Request) {
	const session = await toastSessionStorage.getSession(
		request.headers.get('cookie'),
	)
	const result = ToastSchema.safeParse(session.get(toastKey))
	const toast = result.success ? result.data : null
	return {
		toast,
		headers: toast
			? new Headers({
					'set-cookie': await toastSessionStorage.destroySession(session),
				})
			: null,
	}
}
