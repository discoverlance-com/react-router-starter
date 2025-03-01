import fsExtra from 'fs-extra'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDirPath = path.join(__dirname, '..', 'fixtures')

export async function readFixture(subdir: string, name: string) {
	return fsExtra.readJSON(path.join(fixturesDirPath, subdir, `${name}.json`))
}

export async function createFixture(
	subdir: string,
	name: string,
	data: unknown,
) {
	const dir = path.join(fixturesDirPath, subdir)
	await fsExtra.ensureDir(dir)
	return fsExtra.writeJSON(path.join(dir, `./${name}.json`), data)
}

export const TodoSchema = z.object({
	title: z.string(),
	body: z.string(),
	userId: z.string(),
})

export async function writeTodo(rawTodo: unknown) {
	const todo = TodoSchema.parse(rawTodo)
	await createFixture('todo', todo.userId, todo)
	return todo
}

export async function requireTodo(user: string) {
	const todo = await readTodo(user)
	if (!todo) throw new Error(`Todo to ${user} not found`)
	return todo
}

export async function readTodo(user: string) {
	try {
		const todo = await readFixture('todo', user)
		return TodoSchema.parse(todo)
	} catch (error) {
		console.error(`Error reading todo`, error)
		return null
	}
}

export function requireHeader(headers: Headers, header: string) {
	if (!headers.has(header)) {
		const headersString = JSON.stringify(
			Object.fromEntries(headers.entries()),
			null,
			2,
		)
		throw new Error(
			`Header "${header}" required, but not found in ${headersString}`,
		)
	}
	return headers.get(header)
}
