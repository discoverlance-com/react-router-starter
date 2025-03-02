import { z } from 'zod'

export const ToastSchema = z.object({
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
