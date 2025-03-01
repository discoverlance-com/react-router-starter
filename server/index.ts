import { createRequestHandler } from '@react-router/express'
import { ip as ipAddress } from 'address'
import chalk from 'chalk'
import closeWithGrace from 'close-with-grace'
import compression from 'compression'
import express from 'express'
import rateLimit from 'express-rate-limit'
import getPort, { portNumbers } from 'get-port'
import helmet from 'helmet'
import morgan from 'morgan'
import crypto from 'node:crypto'
import { type ServerBuild } from 'react-router'

const MODE = process.env.NODE_ENV ?? 'development'
const IS_PROD = MODE === 'production'
const IS_DEV = MODE === 'development'
const ALLOW_INDEXING = process.env.ALLOW_INDEXING === 'false'

const viteDevServer = IS_PROD
	? undefined
	: await import('vite').then((vite) =>
			vite.createServer({
				server: { middlewareMode: true },
			}),
		)

const app = express()

const getHost = (req: { get: (key: string) => string | undefined }) =>
	req.get('X-Forwarded-Host') ?? req.get('host') ?? ''

// fly is our proxy
app.set('trust proxy', true)

// ensure HTTPS only (X-Forwarded-Proto comes from Fly)
app.use((req, res, next) => {
	if (req.method !== 'GET') return next()
	const proto = req.get('X-Forwarded-Proto')
	const host = getHost(req)
	if (proto === 'http') {
		res.set('X-Forwarded-Proto', 'https')
		res.redirect(`https://${host}${req.originalUrl}`)
		return
	}
	next()
})

// no ending slashes for SEO reasons
// https://github.com/epicweb-dev/epic-stack/discussions/108
app.get('*', (req, res, next) => {
	if (req.path.endsWith('/') && req.path.length > 1) {
		const query = req.url.slice(req.path.length)
		const safepath = req.path.slice(0, -1).replace(/\/+/g, '/')
		res.redirect(302, safepath + query)
	} else {
		next()
	}
})

app.use(compression())

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by')

if (viteDevServer) {
	app.use(viteDevServer.middlewares)
} else {
	// Remix fingerprints its assets so we can cache forever.
	app.use(
		'/assets',
		express.static('build/client/assets', { immutable: true, maxAge: '1y' }),
	)

	// Everything else (like favicon.ico) is cached for an hour. You may want to be
	// more aggressive with this caching.
	app.use(express.static('build/client', { maxAge: '1h' }))
}

app.get(['/images/*', '/favicons/*', '/pwa-icons/*'], (_req, res) => {
	// if we made it past the express.static for these, then we're missing something.
	// So we'll just send a 404 and won't bother calling other middleware.
	res.status(404).send('Not found')
})

morgan.token('url', (req) => {
	try {
		return decodeURIComponent(req.url ?? '')
	} catch {
		return req.url ?? ''
	}
})

app.use(
	morgan('tiny', {
		skip: (req, res) =>
			res.statusCode === 200 && req.url?.startsWith('/resources/healthcheck'),
	}),
)

app.use((_, res, next) => {
	res.locals.cspNonce = crypto.randomBytes(16).toString('hex')
	next()
})

function formatDuration(duration: number) {
	if (duration < 1000) return `${duration.toFixed(2)}ms`
	if (duration < 60000) return `${(duration / 1000).toFixed(2)}s`
	if (duration < 3600000)
		return `${Math.floor(duration / 60000)}min ${((duration % 60000) / 1000).toFixed(2)}s`
	return `${Math.floor(duration / 3600000)}h ${Math.floor((duration % 3600000) / 60000)}min`
}

function getUrl(url: URL) {
	if (url.pathname === '/__manifest') return url.pathname
	return url.pathname + url.search
}

function getEmotion(status: number) {
	if (status >= 200 && status < 300) return ' SUCCESS '
	if (status >= 400 && status < 500) return ' CLIENT ERROR '
	if (status >= 500) return ' SERVER ERROR '
	return ' OTHER '
}

app.use((req, res, next) => {
	const start = performance.now()
	const name = 'EPIC LOGGER'.toUpperCase()

	// Styles pour le terminal avec des couleurs (ANSI escape codes)
	const colors = {
		reset: '\x1b[0m',
		bold: '\x1b[1m',
		green: '\x1b[32m',
		yellow: '\x1b[33m',
		red: '\x1b[31m',
		cyan: '\x1b[36m',
		magenta: '\x1b[35m',
	}

	const method = req.method
	const url = getUrl(new URL(`http://localhost:${portToUse}${req.url}`))

	const epic = `${colors.bold}[ ${'-'.repeat(name.length)} ]${colors.reset}`
	console.log(`${epic} ${method} ${url} Processing...`)

	res.on('finish', () => {
		const duration = performance.now() - start
		const status = res.statusCode

		const methodStyled = `${colors.bold}${method === 'GET' ? colors.green : colors.yellow}${method}${colors.reset}`
		const statusStyled = `${
			status >= 200 && status < 300
				? colors.green
				: status >= 400 && status < 500
					? colors.yellow
					: status >= 500
						? colors.red
						: colors.cyan
		}${status}${colors.reset}`

		const emotion = getEmotion(status)
		const formattedDuration = formatDuration(duration)

		console.log(
			`${colors.magenta}[${emotion}] ${methodStyled} ${url} ${statusStyled} (${formattedDuration})`,
		)
	})

	next()
})

app.use(
	helmet({
		xPoweredBy: false,
		referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
		strictTransportSecurity: {
			includeSubDomains: true,
			maxAge: 31536000,
			preload: true,
		},
		xFrameOptions: {
			action: 'deny',
		},
		xXssProtection: true,
		crossOriginEmbedderPolicy: false,
		contentSecurityPolicy: {
			// NOTE: Remove reportOnly when you're ready to enforce this CSP
			reportOnly: true,
			directives: {
				//@ts-ignore
				'connect-src': [
					IS_DEV ? 'ws:' : null,
					IS_DEV ? 'ws://*.localhost' : null,
					IS_DEV ? 'ws://*.localhost:24678' : null,
					process.env.SENTRY_DSN ? '*.sentry.io' : null,
					"'self'",
				].filter(Boolean),
				'font-src': ["'self'", 'fonts.gstatic.com'],
				'frame-src': ["'self'"],
				//@ts-ignore
				'img-src': [
					"'self'",
					'data:',
					IS_DEV ? 'adwuma.localhost' : null,
				].filter(Boolean),
				'style-src': ["'self'", `'unsafe-inline'`, 'fonts.googleapis.com'],
				'script-src': [
					// "'strict-dynamic'",
					"'self'",
					// @ts-expect-error
					(_, res) => `'nonce-${res.locals.cspNonce}'`,
				],
				'script-src-attr': [
					// @ts-expect-error
					(_, res) => `'nonce-${res.locals.cspNonce}'`,
				],
				'upgrade-insecure-requests': null,
			},
		},
	}),
)

app.use('/sw.js', (_, res, next) => {
	res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
	res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
	res.setHeader(
		'Content-Security-Policy',
		"default-src 'self'; script-src 'self' 'unsafe-eval'",
	)
	next()
})

app.use((_, res, next) => {
	res.set('X-Robots-Tag', 'noindex, nofollow')
	next()
})

// When running tests or running in development, we want to effectively disable
// rate limiting because playwright tests are very fast and we don't want to
// have to wait for the rate limit to reset between tests.
const maxMultiple =
	!IS_PROD || process.env.PLAYWRIGHT_TEST_BASE_URL ? 10_000 : 1
const rateLimitDefault = {
	windowMs: 60 * 1000,
	max: 1000 * maxMultiple,
	standardHeaders: true,
	legacyHeaders: false,
	validate: { trustProxy: false },
	// Malicious users can spoof their IP address which means we should not deault
	// to trusting req.ip when hosted on Fly.io. However, users cannot spoof Fly-Client-Ip.
	// When sitting behind a CDN such as cloudflare, replace fly-client-ip with the CDN
	// specific header such as cf-connecting-ip
	keyGenerator: (req: express.Request) => {
		return req.get('fly-client-ip') ?? `${req.ip}`
	},
}

const strongestRateLimit = rateLimit({
	...rateLimitDefault,
	windowMs: 60 * 1000,
	max: 10 * maxMultiple,
})

const strongRateLimit = rateLimit({
	...rateLimitDefault,
	windowMs: 60 * 1000,
	max: 100 * maxMultiple,
})

const generalRateLimit = rateLimit(rateLimitDefault)
app.use((req, res, next) => {
	const strongPaths: string[] = [] // add strong paths to protect here
	if (req.method !== 'GET' && req.method !== 'HEAD') {
		if (strongPaths.some((p) => req.path.includes(p))) {
			return strongestRateLimit(req, res, next)
		}
		return strongRateLimit(req, res, next)
	}

	return generalRateLimit(req, res, next)
})

async function getBuild() {
	try {
		const build = viteDevServer
			? await viteDevServer.ssrLoadModule('virtual:react-router/server-build')
			: // @ts-expect-error - the file might not exist yet but it will
				await import('../build/server/index.js')

		return { build: build as unknown as ServerBuild, error: null }
	} catch (error) {
		// Catch error and return null to make express happy and avoid an unrecoverable crash
		console.error('Error creating build:', error)
		return { error: error, build: null as unknown as ServerBuild }
	}
}

if (!ALLOW_INDEXING) {
	app.use((_, res, next) => {
		res.set('X-Robots-Tag', 'noindex, nofollow')
		next()
	})
}

app.all(
	'*',
	createRequestHandler({
		getLoadContext: (_: any, res: any) => ({
			cspNonce: res.locals.cspNonce,
			serverBuild: getBuild(),
		}),
		mode: MODE,
		build: async () => {
			const { error, build } = await getBuild()
			// gracefully "catch" the error
			if (error) {
				throw error
			}
			return build
		},
	}),
)

const desiredPort = Number(process.env.PORT || 3000)
const portToUse = await getPort({
	port: portNumbers(desiredPort, desiredPort + 100),
})
const portAvailable = desiredPort === portToUse
if (!portAvailable && !IS_DEV) {
	console.log(`⚠️ Port ${desiredPort} is not available.`)
	process.exit(1)
}

const server = app.listen(portToUse, () => {
	if (!portAvailable) {
		console.warn(
			chalk.yellow(
				`⚠️  Port ${desiredPort} is not available, using ${portToUse} instead.`,
			),
		)
	}
	console.log(`🚀  We have liftoff!`)
	const localUrl = `http://localhost:${portToUse}`
	let lanUrl: string | null = null
	const localIp = ipAddress() ?? 'Unknown'
	// Check if the address is a private ip
	// https://en.wikipedia.org/wiki/Private_network#Private_IPv4_address_spaces
	// https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-dev-utils/WebpackDevServerUtils.js#LL48C9-L54C10
	if (/^10[.]|^172[.](1[6-9]|2[0-9]|3[0-1])[.]|^192[.]168[.]/.test(localIp)) {
		lanUrl = `http://${localIp}:${portToUse}`
	}

	console.log(
		`
${chalk.bold('Local:')}            ${chalk.cyan(localUrl)}
${lanUrl ? `${chalk.bold('On Your Network:')}  ${chalk.cyan(lanUrl)}` : ''}
${chalk.bold('Press Ctrl+C to stop')}
		`.trim(),
	)
})

closeWithGrace(async ({ err }) => {
	await new Promise((resolve, reject) => {
		server.close((e) => (e ? reject(e) : resolve('ok')))
	})
	if (err) {
		//@ts-ignore
		console.error(chalk.red(err))
		//@ts-ignore
		console.error(chalk.red(err.stack))
	}
})
