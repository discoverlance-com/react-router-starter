import { getFormProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { Laptop, Moon, Sun } from 'lucide-react'
import { useFetcher, useFetchers } from 'react-router'
import { ServerOnly } from 'remix-utils/server-only'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useHints, useOptionalHints } from '@/utils/client-hints'
import { useOptionalRequestInfo, useRequestInfo } from '@/utils/request-info'

import { type action } from './route'

// import { type Theme } from '@/utils/theme.server'
// server file import fails even though it's a type so add type again
type Theme = 'light' | 'dark'

const ThemeFormSchema = z.object({
	theme: z.enum(['system', 'light', 'dark']),
	// this is useful for progressive enhancement
	redirectTo: z.string().optional(),
})

export function ThemeSwitch({
	userPreference,
}: {
	userPreference?: Theme | null
}) {
	const fetcher = useFetcher<typeof action>()
	const requestInfo = useRequestInfo()

	const [form] = useForm({
		id: 'theme-switch',
		lastResult: fetcher.data?.result,
	})

	const optimisticMode = useOptimisticThemeMode()
	const mode = optimisticMode ?? userPreference ?? 'system'

	// const nextMode =
	// 	mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system'
	const modeLabel = {
		light: <Sun />,
		dark: <Moon />,
		system: <Laptop />,
	}

	return (
		<div className="flex gap-2">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" className="h-7 w-7">
						{modeLabel[mode]}
						<span className="sr-only">Toggle theme</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<fetcher.Form
						method="POST"
						{...getFormProps(form)}
						action="/resources/theme-switch"
					>
						<ServerOnly>
							{() => (
								<input
									type="hidden"
									name="redirectTo"
									value={requestInfo.path}
								/>
							)}
						</ServerOnly>
						{Object.keys(modeLabel).map((key) => {
							// display all modes
							return (
								<DropdownMenuItem
									key={key}
									asChild
									className="w-full cursor-pointer"
								>
									<button name="theme" type="submit" value={key}>
										{modeLabel[key as keyof typeof modeLabel]}{' '}
										{key.charAt(0).toUpperCase() + key.slice(1)}
									</button>
								</DropdownMenuItem>
							)
						})}
					</fetcher.Form>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}

/**
 * If the user's changing their theme mode preference, this will return the
 * value it's being changed to.
 */
export function useOptimisticThemeMode() {
	const fetchers = useFetchers()
	const themeFetcher = fetchers.find(
		(f) => f.formAction === '/resources/theme-switch',
	)

	if (themeFetcher && themeFetcher.formData) {
		const submission = parseWithZod(themeFetcher.formData, {
			schema: ThemeFormSchema,
		})

		if (submission.status === 'success') {
			return submission.value.theme
		}
	}
}

/**
 * @returns the user's theme preference, or the client hint theme if the user
 * has not set a preference.
 */
export function useTheme() {
	const hints = useHints()
	const requestInfo = useRequestInfo()
	const optimisticMode = useOptimisticThemeMode()
	if (optimisticMode) {
		return optimisticMode === 'system' ? hints.theme : optimisticMode
	}
	return requestInfo.userPrefs.theme ?? hints.theme
}

export function useOptionalTheme() {
	const optionalHints = useOptionalHints()
	const optionalRequestInfo = useOptionalRequestInfo()
	const optimisticMode = useOptimisticThemeMode()
	if (optimisticMode) {
		return optimisticMode === 'system' ? optionalHints?.theme : optimisticMode
	}
	return optionalRequestInfo?.userPrefs.theme ?? optionalHints?.theme
}
