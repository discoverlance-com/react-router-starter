import { ZodError } from 'zod'

export function getErrorMessage(error: unknown): string {
	if (typeof error === 'string') return error

	if (error instanceof ZodError) {
		const errors = error.issues.map((issue) => {
			return issue.message
		})
		return errors.join('\n')
	} else if (error instanceof Error) {
		return error.message
	} else if (
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof error.message === 'string'
	) {
		return error.message
	}
	console.error('Unable to get error message for error', error)
	return 'Something went wrong. Please try again later.'
}

export function getDomainUrl(request: Request) {
	const host =
		request.headers.get('X-Forwarded-Host') ??
		request.headers.get('host') ??
		new URL(request.url).host
	const protocol =
		request.headers.get('X-Forwarded-Proto') ??
		(process.env.USE_SECURE_COOKIES === 'true' ? 'https' : 'http')
	return `${protocol}://${host}`
}

export function getReferrerRoute(request: Request) {
	// spelling errors and whatever makes this annoyingly inconsistent
	// in my own testing, `referer` returned the right value, but 🤷‍♂️
	const referrer =
		request.headers.get('referer') ??
		request.headers.get('referrer') ??
		request.referrer
	const domain = getDomainUrl(request)
	if (referrer?.startsWith(domain)) {
		return referrer.slice(domain.length)
	} else {
		return '/'
	}
}

/**
 * Merge multiple headers objects into one (uses set so headers are overridden)
 */
export function mergeHeaders(
	...headers: Array<ResponseInit['headers'] | null | undefined>
) {
	const merged = new Headers()
	for (const header of headers) {
		if (!header) continue
		for (const [key, value] of new Headers(header).entries()) {
			merged.set(key, value)
		}
	}
	return merged
}

/**
 * Combine multiple header objects into one (uses append so headers are not overridden)
 */
export function combineHeaders(
	...headers: Array<ResponseInit['headers'] | null | undefined>
) {
	const combined = new Headers()
	for (const header of headers) {
		if (!header) continue
		for (const [key, value] of new Headers(header).entries()) {
			combined.append(key, value)
		}
	}
	return combined
}

/**
 * Combine multiple response init objects into one (uses combineHeaders)
 */
export function combineResponseInits(
	...responseInits: Array<ResponseInit | null | undefined>
) {
	let combined: ResponseInit = {}
	for (const responseInit of responseInits) {
		combined = {
			...responseInit,
			headers: combineHeaders(combined.headers, responseInit?.headers),
		}
	}
	return combined
}

interface SortOptions {
	field: string // The field to sort by
	order?: 'asc' | 'desc' // The sort order (default is "asc")
}

/**
 * Sorts an array of objects dynamically based on the field type (string, number, or Date).
 * @param data - The array to sort.
 * @param options - Sorting options (field and order).
 * @returns The sorted array.
 */
export function dynamicSort<T>(data: T[], options: SortOptions): T[] {
	const { field, order = 'asc' } = options

	if (!Array.isArray(data)) {
		throw new Error('Data must be an array.')
	}

	if (!['asc', 'desc'].includes(order)) {
		throw new Error(
			`Invalid order "${order}". Supported orders are "asc" and "desc".`,
		)
	}

	return data.sort((a, b) => {
		const valueA = a[field as keyof T]
		const valueB = b[field as keyof T]

		if (valueA === undefined || valueB === undefined) {
			throw new Error(`Field "${field}" does not exist on one or more objects.`)
		}

		let comparison: number

		if (valueA instanceof Date && valueB instanceof Date) {
			// Handle Date objects
			comparison = valueA.getTime() - valueB.getTime()
		} else if (typeof valueA === 'string' && typeof valueB === 'string') {
			// Handle strings (case-insensitive)
			comparison = valueA.localeCompare(valueB, undefined, {
				sensitivity: 'base',
			})
		} else if (typeof valueA === 'number' && typeof valueB === 'number') {
			// Handle numbers
			comparison = valueA - valueB
		} else {
			throw new Error(
				`Unsupported field type for sorting. Ensure the field "${field}" contains strings, numbers, or Date objects.`,
			)
		}

		return order === 'asc' ? comparison : -comparison
	})
}
