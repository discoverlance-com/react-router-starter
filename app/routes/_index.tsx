import { SEO } from '@/config/site'
import { Welcome } from '@/welcome/welcome'

import type { Route } from './+types/_index'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: SEO.title },
		{ name: 'description', content: SEO.description },
	]
}

export default function Page() {
	return <Welcome />
}
