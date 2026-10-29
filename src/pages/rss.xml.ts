import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";
import { author, site } from "../config";
import { coverFor, getPosts, urlOf } from "../lib/posts";

const md = new MarkdownIt({ html: true, linkify: true });

export async function GET(context: APIContext) {
	const posts = await getPosts();
	const base = context.site ?? site.url;
	return rss({
		title: site.title,
		description: site.description,
		site: base,
		customData: `<language>${site.lang}</language>`,
		items: posts.map((p) => {
			const cover = new URL(coverFor(p), base).href;
			// Make root-relative image paths absolute so feed readers can load them.
			const html = md
				.render(p.body)
				.replace(/(src|href)="\/(?!\/)/g, `$1="${new URL("/", base).href}`);
			return {
				title: p.data.title,
				pubDate: p.data.published,
				description: p.data.description,
				link: urlOf(p),
				categories: [p.data.category ?? "", ...p.data.tags].filter(Boolean),
				author: author.name,
				content: `<p><img src="${cover}" alt="" /></p>${sanitizeHtml(html, {
					allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
				})}`,
			};
		}),
	});
}
