import { type CollectionEntry, getCollection } from "astro:content";
import { themeForCategory } from "../config";

export type Post = CollectionEntry<"posts">;

/** Drafts are hidden in production but visible while running `astro dev`. */
const isVisible = (p: Post) => import.meta.env.DEV || !p.data.draft;

const byNewest = (a: Post, b: Post) =>
	b.data.published.valueOf() - a.data.published.valueOf();

/** Every publishable post, newest first. */
export async function getPosts(): Promise<Post[]> {
	const posts = await getCollection("posts", isVisible);
	return posts.sort(byNewest);
}

/** Resolved cover URL: explicit frontmatter wins, else the generated art. */
export function coverFor(post: Post): string {
	return (
		post.data.cover || `/assets/covers/${post.id.replace(/\.mdx?$/, "")}.webp`
	);
}

/** Social card for a post; generated alongside the cover. */
export function ogFor(post: Post): string {
	return `/assets/covers/${post.id.replace(/\.mdx?$/, "")}-og.png`;
}

export function slugOf(post: Post): string {
	return post.slug;
}

export function urlOf(post: Post): string {
	return `/posts/${post.slug}/`;
}

export function accentFor(post: Post): number {
	return themeForCategory(post.data.category).hue;
}

/** Posts that are CTF write-ups, i.e. carry a `ctf:` frontmatter key. */
export function writeups(posts: Post[]): Post[] {
	return posts.filter((p) => Boolean(p.data.ctf));
}

export interface Group<T> {
	key: string;
	items: T[];
}

/** Group write-ups by CTF, most recent event first. */
export function groupByCtf(posts: Post[]): Group<Post>[] {
	const map = new Map<string, Post[]>();
	for (const p of writeups(posts)) {
		const key = p.data.ctf;
		if (!map.has(key)) map.set(key, []);
		map.get(key)?.push(p);
	}
	return [...map.entries()]
		.map(([key, items]) => ({ key, items: items.sort(byNewest) }))
		.sort(
			(a, b) =>
				b.items[0].data.published.valueOf() -
				a.items[0].data.published.valueOf(),
		);
}

/** Group posts by publication year, newest year first. */
export function groupByYear(posts: Post[]): Group<Post>[] {
	const map = new Map<number, Post[]>();
	for (const p of posts) {
		const y = p.data.published.getUTCFullYear();
		if (!map.has(y)) map.set(y, []);
		map.get(y)?.push(p);
	}
	return [...map.entries()]
		.sort((a, b) => b[0] - a[0])
		.map(([y, items]) => ({ key: String(y), items: items.sort(byNewest) }));
}

export interface Facet {
	name: string;
	count: number;
}

const byCountThenName = (a: Facet, b: Facet) =>
	b.count - a.count || a.name.localeCompare(b.name);

export function tagsOf(posts: Post[]): Facet[] {
	const counts = new Map<string, number>();
	for (const p of posts) {
		for (const t of p.data.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
	}
	return [...counts]
		.map(([name, count]) => ({ name, count }))
		.sort(byCountThenName);
}

export function categoriesOf(posts: Post[]): Facet[] {
	const counts = new Map<string, number>();
	for (const p of posts) {
		const c = p.data.category;
		if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
	}
	return [...counts]
		.map(([name, count]) => ({ name, count }))
		.sort(byCountThenName);
}

/** URL-safe slug for a tag or category, used by /tags/* and /categories/*. */
export function facetSlug(value: string): string {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/đ/g, "d")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/** Site-wide counters for the hero stats strip. */
export function statsOf(posts: Post[]) {
	const ctfs = new Set(posts.map((p) => p.data.ctf).filter(Boolean));
	return {
		posts: posts.length,
		writeups: writeups(posts).length,
		ctfs: ctfs.size,
		tags: tagsOf(posts).length,
		categories: categoriesOf(posts).length,
	};
}

/**
 * Previous/next within the full chronological list, so a post always links
 * to its real neighbours rather than to neighbours inside a filtered view.
 */
export function neighboursOf(posts: Post[], current: Post) {
	const i = posts.findIndex((p) => p.id === current.id);
	return {
		newer: i > 0 ? posts[i - 1] : null,
		older: i >= 0 && i < posts.length - 1 ? posts[i + 1] : null,
	};
}

/** Posts sharing the most tags with `current`, excluding itself. */
export function relatedTo(posts: Post[], current: Post, limit = 3): Post[] {
	const tags = new Set(current.data.tags);
	return posts
		.filter((p) => p.id !== current.id)
		.map((p) => {
			const shared = p.data.tags.filter((t) => tags.has(t)).length;
			const sameCategory = p.data.category === current.data.category ? 1 : 0;
			return { post: p, score: shared * 2 + sameCategory };
		})
		.filter((x) => x.score > 0)
		.sort(
			(a, b) =>
				b.score - a.score ||
				b.post.data.published.valueOf() - a.post.data.published.valueOf(),
		)
		.slice(0, limit)
		.map((x) => x.post);
}

/** Reading time from the remark plugin; renders the post (Astro caches it). */
export async function minutesFor(post: Post): Promise<number> {
	const { remarkPluginFrontmatter } = await post.render();
	return Number(remarkPluginFrontmatter.minutes) || 1;
}

export async function withMinutes(posts: Post[]) {
	return Promise.all(
		posts.map(async (post) => ({ post, minutes: await minutesFor(post) })),
	);
}
