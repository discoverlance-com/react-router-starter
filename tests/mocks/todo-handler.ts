import { faker } from '@faker-js/faker'
import { http, type HttpHandler, HttpResponse } from 'msw'

import { writeTodo } from './utils'

const { json } = HttpResponse

export const handlers: Array<HttpHandler> = [
	http.post(
		`https://jsonplaceholder.typicode.com/todos`,
		async ({ request }) => {
			const body = await request.json()
			console.info('🔶 mocked todo contents:', body)

			const todo = await writeTodo(body)

			return json({
				id: faker.string.uuid(),
				title: todo.title,
				body: todo.body,
				userId: todo.userId,
			})
		},
	),
]
