import closeWithGrace from 'close-with-grace'
import { setupServer } from 'msw/node'

//example handler for todos
import { handlers as todoHandler } from './todo-handler'

export const server = setupServer(...todoHandler)

server.listen({
	onUnhandledRequest(request, print) {
		// Print the regular MSW unhandled request warning otherwise.
		print.warning()
	},
})

if (process.env.NODE_ENV !== 'test') {
	console.info('🔶 Mock server installed')

	closeWithGrace(() => {
		server.close()
	})
}
