import { defineCollection, z } from "astro:content";

const posts = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),

		category: z.string().optional().nullable().default("Notes"),
		tags: z.array(z.string()).optional().default([]),
		lang: z.string().optional().default("vi"),

		/* CTF-specific metadata, surfaced on the write-ups page. */
		ctf: z.string().optional().default(""),
		points: z.number().nonnegative().optional(),
		difficulty: z.string().optional().default(""),

		/**
		 * Cover image. Left empty, the post falls back to its generated art at
		 * /assets/covers/<slug>.webp (see scripts/generate-covers.mjs).
		 */
		cover: z.string().optional().default(""),
		coverAlt: z.string().optional().default(""),

		/** Pinned to the top of the home page. */
		featured: z.boolean().optional().default(false),
	}),
});

const spec = defineCollection({
	type: "content",
	schema: z.object({}).passthrough(),
});

export const collections = { posts, spec };
