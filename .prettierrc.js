/** @type {import("prettier").Options} */
export const config = {
	bracketSpacing: true,
	arrowParens: 'always',
	bracketSameLine: false,
	embeddedLanguageFormatting: 'auto',
	endOfLine: 'lf',
	htmlWhitespaceSensitivity: 'css',
	insertPragma: false,
	jsxSingleQuote: false,
	printWidth: 80,
	proseWrap: 'always',
	quoteProps: 'as-needed',
	requirePragma: false,
	semi: false,
	singleAttributePerLine: false,
	singleQuote: true,
	tabWidth: 2,
	trailingComma: 'all',
	useTabs: true,

	overrides: [
		{
			files: ['**/package.json'],
			options: {
				useTabs: false,
			},
		},
		{
			files: ['**/*.mdx'],
			options: {
				proseWrap: 'preserve',
				htmlWhitespaceSensitivia: 'ignore',
			},
		},
	],

	tailwindConfig: './tailwind.config.ts',
	// .. your overrides here..
	plugins: [
		'prettier-plugin-tailwindcss',
		'@trivago/prettier-plugin-sort-imports',
	],
	importOrder: [
		'^server-only',
		'^client-only',
		'dotenv/config',
		'<THIRD_PARTY_MODULES>',
		'^@adwuma',
		'^@/',
		'^[./]',
		'@testing-library/jest-dom/vitest',
	],
	tailwindAttributes: ['class', 'className', 'ngClass', '.*[cC]lassName'],
	tailwindFunctions: ['clsx', 'cn'],
	importOrderSeparation: true,
	importOrderSortSpecifiers: true,
	importOrderCaseInsensitive: true,
}

export default config
