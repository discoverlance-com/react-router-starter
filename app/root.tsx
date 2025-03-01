import {
	data,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
	useRouteLoaderData,
} from 'react-router'
import { HoneypotProvider } from 'remix-utils/honeypot/react'

import type { Route } from './+types/root'
import './app.css'
import { EpicProgressBar } from './components/epic-progress-bar'
import { useToast } from './hooks/use-toast'
import { getToast } from './lib/cookies/toast.server'
import { useOptionalTheme } from './routes/resources.theme-switch/theme-switcher'
import { ClientHintCheck, getHints } from './utils/client-hints'
import { getEnv } from './utils/env.server'
import { honeypot } from './utils/honeypot.server'
import { combineHeaders, getDomainUrl } from './utils/misc'
import { useNonce } from './utils/nonce-provider'
import { getTheme, type Theme } from './utils/theme.server'
import { makeTimings } from './utils/timing.server'

export const links: Route.LinksFunction = () => [
	{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
	{
		rel: 'preconnect',
		href: 'https://fonts.gstatic.com',
		crossOrigin: 'anonymous',
	},
	{
		rel: 'stylesheet',
		href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
	},
]

export const loader = async ({ request }: Route.LoaderArgs) => {
	const timings = makeTimings('root loader')

	const { toast, headers: toastHeaders } = await getToast(request)

	return data(
		{
			toast,
			honeypotInputProps: await honeypot.getInputProps(),
			requestInfo: {
				hints: getHints(request),
				origin: getDomainUrl(request),
				path: new URL(request.url).pathname,
				userPrefs: {
					theme: getTheme(request),
				},
			},
			ENV: getEnv(),
		},
		{
			headers: combineHeaders(
				{ 'Server-Timing': timings.toString() },
				toastHeaders,
			),
		},
	)
}

export const headers = ({ loaderHeaders }: Route.HeadersArgs) => {
	const headers = {
		'Server-Timing': loaderHeaders.get('Server-Timing') ?? '',
	}
	return headers
}

export function Layout({ children }: { children: React.ReactNode }) {
	const data = useRouteLoaderData<typeof loader>('root')
	const theme = useOptionalTheme()
	const nonce = useNonce()

	return (
		<Document
			theme={theme}
			env={data?.ENV as Record<string, string>}
			nonce={nonce}
		>
			{children}
		</Document>
	)
}

function Document({
	children,
	nonce,
	theme = 'light',
	env = {},
}: {
	nonce?: string
	theme?: Theme
	children: React.ReactNode
	env?: Record<string, string>
}) {
	const allowIndexing = ENV.ALLOW_INDEXING !== 'false'

	return (
		<html
			lang="en"
			// className={`${theme}`}
			suppressHydrationWarning
		>
			<head>
				<meta charSet="utf-8" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no"
				/>

				{allowIndexing ? null : (
					<meta name="robots" content="noindex, nofollow" />
				)}

				<ClientHintCheck nonce={nonce} />
				<Meta />
				<Links />
			</head>
			<body
				className="font-sans antialiased scroll-smooth relative"
				suppressHydrationWarning
			>
				<EpicProgressBar />
				{children}

				<script
					nonce={nonce}
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(env)}`,
					}}
				/>
				<ScrollRestoration nonce={nonce} />
				<Scripts nonce={nonce} />
			</body>
		</html>
	)
}

function App() {
	const data = useLoaderData<typeof loader>()
	useToast(data?.toast)

	return <Outlet />
}

export default function AppWithProviders() {
	const data = useLoaderData<typeof loader>()
	return (
		<HoneypotProvider {...data.honeypotInputProps}>
			<App />
		</HoneypotProvider>
	)
}

// export const ErrorBoundary = GeneralErrorBoundary
