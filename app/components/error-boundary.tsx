import { type ReactElement } from 'react'
import {
	type ErrorResponse,
	isRouteErrorResponse,
	Link,
	useNavigate,
	useParams,
	useRouteError,
} from 'react-router'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
} from '@/components/ui/card'
import { siteLinks } from '@/config/site'
import { getErrorMessage } from '@/utils/misc'

type StatusHandler = (info: {
	error: ErrorResponse
	params: Record<string, string | undefined>
}) => ReactElement | null

export const GeneralErrorBoundary = ({
	defaultStatusHandler = ({ error }) => {
		const navigate = useNavigate()

		let message = 'Oops!'
		let details = 'An unexpected error occurred.'
		let stack: string | undefined
		let status = error.status

		message =
			error.status === 401
				? 'Unauthorized'
				: error.status === 403
					? 'Forbidden'
					: 'Error'
		details =
			status === 401
				? 'The action you are trying to perform requires you to be logged in. Please login to continue.'
				: status === 403
					? 'You are not authorized to perform this action.'
					: error.data || error.statusText || details
		return (
			<Card className="mx-auto max-w-sm">
				<CardHeader>
					<h1 className="font-bold leading-none tracking-tight text-4xl flex gap-2 items-center">
						{status}
					</h1>
					<CardDescription>{message}</CardDescription>
				</CardHeader>

				<CardContent>
					<p className="text-center text-muted-foreground text-sm whitespace-pre-wrap break-all">
						{details}
					</p>
					{stack && (
						<pre className="w-full p-4 overflow-x-auto">
							<code>{stack}</code>
						</pre>
					)}
				</CardContent>

				<CardFooter className="md:gap-16 sm:gap-8 gap-4 justify-between flex-wrap">
					<Button onClick={() => navigate(-1)}>Go Back</Button>
					<Button asChild variant="outline">
						<Link to={siteLinks.index} viewTransition>
							Go Home
						</Link>
					</Button>
				</CardFooter>
			</Card>
		)
	},
	statusHandlers,
	unexpectedErrorHandler = (error) => {
		const navigate = useNavigate()

		return (
			<Card className="mx-auto max-w-sm">
				<CardHeader>
					<h1 className="font-semibold leading-none tracking-tight text-xl flex gap-2 items-center">
						Unexpected Error
					</h1>
					<CardDescription>
						An unexpected error occurred, please try your action again or alert
						us to fix the issue.
					</CardDescription>
				</CardHeader>

				<CardContent>
					<p className="text-center text-muted-foreground text-sm">
						{getErrorMessage(error)}
					</p>
				</CardContent>

				<CardFooter className="md:gap-16 sm:gap-8 gap-4 justify-between flex-wrap">
					<Button onClick={() => navigate(-1)}>Go Back</Button>
					<Button asChild variant="outline">
						<Link to={siteLinks.index} viewTransition>
							Go Home
						</Link>
					</Button>
				</CardFooter>
			</Card>
		)
	},
}: {
	defaultStatusHandler?: StatusHandler
	statusHandlers?: Record<number, StatusHandler>
	unexpectedErrorHandler?: (error: unknown) => ReactElement | null
}) => {
	const error = useRouteError()
	const params = useParams()

	if (typeof document !== 'undefined') {
		console.error(error)
	}

	return (
		<main className="h-svh grid place-items-center">
			{isRouteErrorResponse(error)
				? (statusHandlers?.[error.status] ?? defaultStatusHandler)({
						error,
						params,
					})
				: unexpectedErrorHandler(error)}
		</main>
	)
}
