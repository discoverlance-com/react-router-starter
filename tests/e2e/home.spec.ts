import { expect, test } from '@playwright/test'

test('has title', async ({ page }) => {
	const pageUrl = '/'
	await page.goto(pageUrl)

	// Expect a title "to contain" a substring.
	await expect(page).toHaveTitle(/New React Router App/)
})

test('can view resource links', async ({ page }) => {
	const pageUrl = '/'
	await page.goto(pageUrl)

	// Expect the resources links to be on the page
	await expect(
		page.getByRole('link', { name: 'React Router Docs' }),
	).toBeVisible()
	await expect(page.getByRole('link', { name: 'Join Discord' })).toBeVisible()

	// Expects page to have a paragraph with the text of What's next?
	await expect(page.getByText("What's next?")).toBeVisible()
})
