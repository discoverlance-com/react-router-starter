import { createReadableStreamFromReadable } from '@react-router/node'
import { isbot } from 'isbot'
import { PassThrough } from 'node:stream'
import type { RenderToPipeableStreamOptions } from 'react-dom/server'
import { renderToPipeableStream } from 'react-dom/server'
import type { HandleDocumentRequestFunction } from 'react-router'
import { ServerRouter } from 'react-router'

import './utils/env.server'
import { NonceProvider } from './utils/nonce-provider'
import { makeTimings } from './utils/timing.server'

export const streamTimeout = 10_000

type DocRequestArgs = Parameters<HandleDocumentRequestFunction>

export default async function handleRequest(...args: DocRequestArgs) {
	let [
		request,
		responseStatusCode,
		responseHeaders,
		routerContext,
		loadContext,
	] = args

	let userAgent = request.headers.get('user-agent')

	let readyOption: keyof RenderToPipeableStreamOptions =
		(userAgent && isbot(userAgent)) || routerContext.isSpaMode
			? 'onAllReady'
			: 'onShellReady'

	const nonce = loadContext.cspNonce?.toString() ?? ''

	return new Promise((resolve, reject) => {
		let shellRendered = false
		// NOTE: this timing will only include things that are rendered in the shell
		// and will not include suspended components and deferred loaders
		const timings = makeTimings('render', 'renderToPipeableStream')

		// Ensure requests from bots and SPA Mode renders wait for all content to load before responding
		// https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation

		const { pipe, abort } = renderToPipeableStream(
			<NonceProvider value={nonce}>
				<ServerRouter context={routerContext} url={request.url} nonce={nonce} />
			</NonceProvider>,
			{
				[readyOption]() {
					shellRendered = true
					const body = new PassThrough()
					const stream = createReadableStreamFromReadable(body)

					responseHeaders.set('Content-Type', 'text/html')

					responseHeaders.append('Server-Timing', timings.toString())

					resolve(
						new Response(stream, {
							headers: responseHeaders,
							status: responseStatusCode,
						}),
					)

					pipe(body)
				},
				onShellError(error: unknown) {
					reject(error)
				},
				onError(error: unknown) {
					responseStatusCode = 500
					// Log streaming rendering errors from inside the shell.  Don't log
					// errors encountered during initial shell rendering since they'll
					// reject and get logged in handleDocumentRequest.
					if (shellRendered) {
						console.error(error)
					}
				},
				nonce: nonce,
			},
		)

		setTimeout(abort, streamTimeout + 1000)
	})
}
