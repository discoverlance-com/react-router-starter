import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { data, redirect } from 'react-router'
import { z } from 'zod'

import { setTheme } from '@/utils/theme.server'

import type { Route } from './+types/route'

const ThemeFormSchema = z.object({
	theme: z.enum(['system', 'light', 'dark']),
	// this is useful for progressive enhancement
	redirectTo: z.string().optional(),
})

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: ThemeFormSchema,
	})

	invariantResponse(submission.status === 'success', 'Invalid theme received')

	const { theme, redirectTo } = submission.value

	const responseInit = {
		headers: { 'set-cookie': setTheme(theme) },
	}
	if (redirectTo) {
		throw redirect(redirectTo, responseInit)
	} else {
		return data({ result: submission.reply() }, responseInit)
	}
}

// export default function Page() {}
