/**
 * Rasterises a cover + OG image for every post into public/assets/covers/.
 *
 *   pnpm covers              regenerate art for every post
 *   node ... --missing       only posts that have no art yet (runs on build)
 *
 * The art looks best with JetBrains Mono installed; without it librsvg falls
 * back to another monospace font. Commit the output after `pnpm covers` so
 * the build's --missing pass leaves your art untouched.
 */

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { buildCover } from "./cover-art.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const POSTS = path.join(root, "src/content/posts");
const OUT = path.join(root, "public/assets/covers");

const HUES = {
	"Reverse Engineering": 265,
	Crypto: 185,
	Pwn: 12,
	Web: 150,
	Forensics: 45,
	Notes: 220,
};

/** Minimal frontmatter reader — enough for the handful of keys we need. */
function frontmatter(raw) {
	const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!m) return {};
	const out = {};
	for (const line of m[1].split(/\r?\n/)) {
		const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
		if (!kv) continue;
		let v = kv[2].trim();
		if (
			(v.startsWith('"') && v.endsWith('"')) ||
			(v.startsWith("'") && v.endsWith("'"))
		) {
			v = v.slice(1, -1);
		}
		out[kv[1]] = v;
	}
	return out;
}

const onlyMissing = process.argv.includes("--missing");

async function main() {
	await mkdir(OUT, { recursive: true });
	let made = 0;
	const files = (await readdir(POSTS)).filter((f) => /\.mdx?$/.test(f));
	if (!files.length) {
		console.log("no posts found");
		return;
	}

	for (const file of files) {
		const slug = file.replace(/\.mdx?$/, "");
		if (
			onlyMissing &&
			existsSync(path.join(OUT, `${slug}.webp`)) &&
			existsSync(path.join(OUT, `${slug}-og.png`))
		) {
			continue;
		}
		const raw = await readFile(path.join(POSTS, file), "utf8");
		const fm = frontmatter(raw);

		const category = fm.category || "Notes";
		const hue = HUES[category] ?? 265;
		const date = (fm.published || "").slice(0, 10);

		const common = { slug, title: fm.title || slug, category, ctf: fm.ctf || "", date, hue };

		// Card cover: 16:9, served as WebP.
		const coverSvg = buildCover({ ...common, width: 1280, height: 720 });
		await sharp(Buffer.from(coverSvg), { density: 144 })
			.resize(1280, 720)
			.webp({ quality: 88 })
			.toFile(path.join(OUT, `${slug}.webp`));

		// Social card: 1200x630, PNG (crawlers are unreliable with WebP/SVG).
		const ogSvg = buildCover({ ...common, width: 1200, height: 630 });
		await sharp(Buffer.from(ogSvg), { density: 144 })
			.resize(1200, 630)
			.png({ compressionLevel: 9 })
			.toFile(path.join(OUT, `${slug}-og.png`));

		console.log(`  ✓ ${slug}  [${category}]`);
		made++;
	}

	if (onlyMissing && existsSync(path.join(OUT, "site-og.png"))) {
		console.log(`covers: ${made} generated, ${files.length - made} already present`);
		return;
	}

	// A site-wide OG image for pages that aren't posts.
	const siteSvg = buildCover({
		slug: "vtnam207-site",
		title: "Vũ Thành Nam",
		category: "Reverse Engineering · CTF",
		date: "",
		hue: 265,
		width: 1200,
		height: 630,
	});
	await sharp(Buffer.from(siteSvg), { density: 144 })
		.resize(1200, 630)
		.png({ compressionLevel: 9 })
		.toFile(path.join(OUT, "site-og.png"));
	console.log("  ✓ site-og");

	console.log(`\nGenerated art for ${made} post(s) -> public/assets/covers/`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
