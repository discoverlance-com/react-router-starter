// This is called a "splat route" and as it's in the root `/app/routes/`
// directory, it's a catchall. If no other routes match, this one will and we
// can know that the user is hitting a URL that doesn't exist. By throwing a
// 404 from the loader, we can force the error boundary to render which will
// ensure the user gets the right status code and we can display a nicer error
// message for them than the Remix and/or browser default.
import { ScanSearchIcon } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router'

import { GeneralErrorBoundary } from '@/components/error-boundary'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
} from '@/components/ui/card'
import { siteLinks } from '@/config/site'

export async function loader() {
	throw new Response('Not found', { status: 404 })
}

export default function NotFound() {
	// due to the loader, this component will never be rendered, but we'll return
	// the error boundary just in case.
	return <ErrorBoundary />
}

export function ErrorBoundary() {
	const location = useLocation()
	const navigate = useNavigate()

	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => (
					<Card className="mx-auto max-w-sm">
						<CardHeader>
							<h1 className="font-bold leading-none tracking-tight text-4xl flex gap-2 items-center">
								404
							</h1>
							<CardDescription>Not Found</CardDescription>
						</CardHeader>

						<CardContent className="space-y-3">
							<p className="text-center text-muted-foreground text-sm">
								We are not able to find the page you are looking for. Either the
								page has been moved or does not exist on this site.
							</p>
							<pre className="whitespace-pre-wrap break-all">
								{location.pathname}
							</pre>
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
				),
			}}
		/>
	)
}
