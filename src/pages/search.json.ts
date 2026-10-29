import type { APIRoute } from "astro";
import { isoDate } from "../lib/format";
import { coverFor, getPosts, urlOf } from "../lib/posts";

/** Strip markdown down to searchable text. Code is kept: people search for function names. */
function plain(md: string): string {
	return md
		.replace(/```[a-z]*\n?/gi, " ")
		.replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/[#>*_`~|$\\]/g, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

export const GET: APIRoute = async () => {
	const posts = await getPosts();
	const docs = posts.map((p) => ({
		title: p.data.title,
		url: urlOf(p),
		description: p.data.description,
		category: p.data.category ?? "",
		ctf: p.data.ctf,
		tags: p.data.tags,
		date: isoDate(p.data.published),
		cover: coverFor(p),
		// Capped so the index stays small as the blog grows.
		body: plain(p.body).slice(0, 12000),
	}));
	return new Response(JSON.stringify(docs), {
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});
};
