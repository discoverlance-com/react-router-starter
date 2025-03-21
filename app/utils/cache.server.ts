import {
	cachified as baseCachified,
	type Cache,
	type CacheEntry,
	type CachifiedOptions,
	type CreateReporter,
	mergeReporters,
	totalTtl,
	verboseReporter,
} from '@epic-web/cachified'
import { remember } from '@epic-web/remember'
import { LRUCache } from 'lru-cache'

import { cachifiedTimingReporter, type Timings } from './timing.server'

const lru = remember(
	'lru-cache',
	() => new LRUCache<string, CacheEntry<unknown>>({ max: 1000 }),
)

export const lruCache = {
	name: 'app-memory-cache',
	set: (key, value) => {
		const ttl = totalTtl(value?.metadata)
		lru.set(key, value, {
			ttl: ttl === Infinity ? undefined : ttl,
			start: value?.metadata?.createdTime,
		})
		return value
	},
	get: (key) => lru.get(key),
	delete: (key) => lru.delete(key),
} satisfies Cache

export async function getAllCacheKeys(limit: number) {
	return {
		lru: [...lru.keys()],
	}
}

export async function searchCacheKeys(search: string, limit: number) {
	return {
		lru: [...lru.keys()].filter((key) => key.includes(search)),
	}
}

export async function cachified<Value>(
	{
		timings,
		...options
	}: CachifiedOptions<Value> & {
		timings?: Timings
	},
	reporter: CreateReporter<Value> = verboseReporter<Value>(),
): Promise<Value> {
	return baseCachified(
		options,
		mergeReporters(cachifiedTimingReporter(timings), reporter),
	)
}
