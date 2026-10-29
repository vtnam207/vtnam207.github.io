/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
	darkMode: ["class", '[data-theme="dark"]'],
	theme: {
		extend: {
			colors: {
				bg: "var(--bg)",
				"bg-soft": "var(--bg-soft)",
				surface: "var(--surface)",
				"surface-2": "var(--surface-2)",
				"surface-3": "var(--surface-3)",
				line: "var(--line)",
				"line-soft": "var(--line-soft)",
				fg: "var(--fg)",
				"fg-dim": "var(--fg-dim)",
				"fg-faint": "var(--fg-faint)",
				accent: "var(--accent)",
				"accent-soft": "var(--accent-soft)",
				"accent-line": "var(--accent-line)",
			},
			fontFamily: {
				sans: ["var(--font-sans)"],
				mono: ["var(--font-mono)"],
			},
			borderRadius: {
				DEFAULT: "var(--radius)",
				lg: "var(--radius-lg)",
				xl: "var(--radius-xl)",
			},
			boxShadow: {
				sm: "var(--shadow-sm)",
				DEFAULT: "var(--shadow)",
				lg: "var(--shadow-lg)",
			},
			maxWidth: {
				shell: "var(--content-width)",
				prose: "var(--prose-width)",
			},
		},
	},
	plugins: [],
};
