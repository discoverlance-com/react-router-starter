import { useEffect } from 'react'
import { toast as showToast } from 'sonner'

import { type Toast } from '@/lib/cookies/cookies-schema'

export function useToast(toast?: Toast | null) {
	useEffect(() => {
		if (toast) {
			setTimeout(() => {
				showToast[toast.type](toast.title, {
					id: toast.id,
					description: toast.description,
					position: toast.position,
				})
			}, 0)
		}
	}, [toast])
}
