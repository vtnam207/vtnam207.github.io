import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import expressiveCode from "astro-expressive-code";
import { defineConfig } from "astro/config";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeComponents from "rehype-components";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive";
import remarkDirectiveRehype from "remark-directive-rehype";
import remarkGithubAdmonitionsToDirectives from "remark-github-admonitions-to-directives";
import remarkMath from "remark-math";
import { AdmonitionComponent } from "./src/plugins/rehype-component-admonition.mjs";
import { rehypeFigures } from "./src/plugins/rehype-figures.mjs";
import { remarkExcerpt } from "./src/plugins/remark-excerpt.js";
import { remarkReadingTime } from "./src/plugins/remark-reading-time.mjs";

const admonition = (type) => (props, children) => AdmonitionComponent(props, children, type);

// https://astro.build/config
export default defineConfig({
	site: "https://vtnam207.github.io",
	base: "/",
	trailingSlash: "always",
	integrations: [
		tailwind({ applyBaseStyles: false, nesting: true }),
		expressiveCode({
			themes: ["github-dark-dimmed", "github-light"],
			// Follow the site's data-theme attribute rather than the OS setting.
			themeCssSelector: (theme) =>
				theme.type === "dark" ? ':root:not([data-theme="light"])' : ':root[data-theme="light"]',
			useDarkModeMediaQuery: false,
			plugins: [pluginCollapsibleSections(), pluginLineNumbers()],
			defaultProps: {
				wrap: true,
				showLineNumbers: true,
				overridesByLang: {
					"shellsession,sh,bash,console,text,plaintext,txt": { showLineNumbers: false },
				},
			},
			styleOverrides: {
				borderRadius: "10px",
				codeFontSize: "0.85rem",
				codeLineHeight: "1.6",
				codeFontFamily: "var(--font-mono)",
				uiFontFamily: "var(--font-sans)",
				codePaddingBlock: "0.95rem",
				codePaddingInline: "1.1rem",
			},
		}),
		sitemap(),
	],
	markdown: {
		remarkPlugins: [
			remarkMath,
			remarkReadingTime,
			remarkExcerpt,
			remarkGithubAdmonitionsToDirectives,
			remarkDirective,
			remarkDirectiveRehype,
		],
		rehypePlugins: [
			rehypeKatex,
			rehypeSlug,
			[
				rehypeComponents,
				{
					components: {
						note: admonition("note"),
						tip: admonition("tip"),
						important: admonition("important"),
						caution: admonition("caution"),
						warning: admonition("warning"),
					},
				},
			],
			[
				rehypeAutolinkHeadings,
				{
					behavior: "prepend",
					properties: { className: ["heading-anchor"], ariaHidden: "true", tabIndex: -1 },
					content: { type: "text", value: "#" },
				},
			],
			rehypeFigures,
		],
	},
	vite: {
		build: { assetsInlineLimit: 4096 },
	},
});
