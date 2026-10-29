/* Create a new post with frontmatter, then generate its cover art. */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const today = new Date().toISOString().slice(0, 10);
const [name, ...rest] = process.argv.slice(2);

if (!name) {
	console.error("Usage: pnpm new-post <slug> [--ctf \"CTF name\"] [--category \"Reverse Engineering\"]");
	process.exit(1);
}

const flag = (key) => {
	const i = rest.indexOf(`--${key}`);
	return i !== -1 ? rest[i + 1] ?? "" : "";
};

const slug = name.replace(/\.(md|mdx)$/i, "");
const file = path.join("src/content/posts", `${slug}.md`);

if (fs.existsSync(file)) {
	console.error(`Error: ${file} already exists`);
	process.exit(1);
}

const ctf = flag("ctf");
const category = flag("category") || (ctf ? "Reverse Engineering" : "Notes");
const title = ctf || slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(
	file,
	`---
title: "${title}"
published: ${today}
description: ""
${ctf ? `ctf: "${ctf}"\n` : ""}category: "${category}"
tags: []
lang: vi
draft: true
# cover: ""      # optional; generated art is used when empty
# featured: true # pin to the home page
---

`,
);
console.log(`Created ${file}`);

// Cover art needs the fonts installed locally; skip quietly if that fails.
try {
	execFileSync("node", ["scripts/generate-covers.mjs", "--missing"], { stdio: "inherit" });
} catch {
	console.warn("Could not generate cover art — run `pnpm covers` later.");
}
