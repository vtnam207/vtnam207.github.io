/**
 * Generative cover art for posts.
 *
 * Every post gets a deterministic image derived from its slug, so the same
 * post always renders the same art and a new post gets one for free. The
 * visual language is a hexdump: a field of bytes with a few lit up, a
 * disassembly-style address gutter, and a category-tinted glow.
 *
 * Produces SVG strings. The caller rasterises them (see generate-covers.mjs).
 */

const HEX = "0123456789abcdef";

/** xmur3 + mulberry32: small, dependency-free, stable across runs. */
function seedFrom(str) {
	let h = 1779033703 ^ str.length;
	for (let i = 0; i < str.length; i++) {
		h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
		h = (h << 13) | (h >>> 19);
	}
	return () => {
		h = Math.imul(h ^ (h >>> 16), 2246822507);
		h = Math.imul(h ^ (h >>> 13), 3266489909);
		h ^= h >>> 16;
		return h >>> 0;
	};
}

function rngFor(slug) {
	const seed = seedFrom(slug)();
	let a = seed;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const esc = (s) =>
	String(s)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

/**
 * Wrap text to a pixel width. Exact for monospace: JetBrains Mono's advance
 * width is 0.6em, so character count maps directly to pixels.
 */
function wrapMono(text, fontSize, maxWidth, maxLines) {
	const perChar = fontSize * 0.6;
	const maxChars = Math.max(8, Math.floor(maxWidth / perChar));
	const words = String(text).split(/\s+/).filter(Boolean);
	const lines = [];
	let line = "";

	for (const word of words) {
		const candidate = line ? `${line} ${word}` : word;
		if (candidate.length <= maxChars) {
			line = candidate;
			continue;
		}
		if (line) lines.push(line);
		// A single word longer than the line gets hard-split.
		if (word.length > maxChars) {
			let rest = word;
			while (rest.length > maxChars) {
				lines.push(rest.slice(0, maxChars - 1) + "-");
				rest = rest.slice(maxChars - 1);
			}
			line = rest;
		} else {
			line = word;
		}
		if (lines.length >= maxLines) break;
	}
	if (line && lines.length < maxLines) lines.push(line);

	if (lines.length > maxLines) lines.length = maxLines;
	// Ellipsise if we dropped content.
	const joined = lines.join(" ");
	if (joined.replace(/\s+/g, " ") !== words.join(" ")) {
		const last = lines[lines.length - 1] ?? "";
		lines[lines.length - 1] =
			last.length > maxChars - 1 ? `${last.slice(0, maxChars - 1)}…` : `${last}…`;
	}
	return lines;
}

/** The hexdump field: rows of address + bytes, a few bytes lit by the accent. */
function hexField(rand, { x, y, rows, cols, size, lineHeight, hue, dim, lit }) {
	const parts = [];
	const charW = size * 0.6;

	for (let r = 0; r < rows; r++) {
		const rowY = y + r * lineHeight;
		const addr = (0x401000 + r * 16).toString(16).padStart(6, "0");

		parts.push(
			`<text x="${x.toFixed(1)}" y="${rowY.toFixed(1)}" font-family="JetBrains Mono" font-size="${size}" fill="${dim}" opacity="0.38">${addr}</text>`,
		);

		const bytesX = x + 7.6 * charW;
		for (let c = 0; c < cols; c++) {
			const v = rand();
			const byte = HEX[Math.floor(rand() * 16)] + HEX[Math.floor(rand() * 16)];
			const bx = bytesX + c * charW * 3;
			// ~9% of bytes are "interesting" and get the accent treatment.
			const hot = v > 0.91;
			const fill = hot ? lit : dim;
			const op = hot ? 0.92 : 0.1 + rand() * 0.22;
			parts.push(
				`<text x="${bx.toFixed(1)}" y="${rowY.toFixed(1)}" font-family="JetBrains Mono" font-size="${size}" fill="${fill}" opacity="${op.toFixed(2)}">${byte}</text>`,
			);
		}
	}
	return parts.join("");
}

/** A few connected nodes — a nod to a call graph — drifting in the corner. */
function nodeGraph(rand, { x, y, w, h, count, accent }) {
	const pts = Array.from({ length: count }, () => ({
		x: x + rand() * w,
		y: y + rand() * h,
		r: 1.8 + rand() * 3.2,
	}));
	const edges = [];
	for (let i = 0; i < pts.length; i++) {
		for (let j = i + 1; j < pts.length; j++) {
			const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
			if (d < Math.min(w, h) * 0.42) {
				edges.push(
					`<line x1="${pts[i].x.toFixed(1)}" y1="${pts[i].y.toFixed(1)}" x2="${pts[j].x.toFixed(1)}" y2="${pts[j].y.toFixed(1)}" stroke="${accent}" stroke-width="1" opacity="${(0.3 - d / (Math.min(w, h) * 2)).toFixed(3)}"/>`,
				);
			}
		}
	}
	const dots = pts.map(
		(p) =>
			`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(1)}" fill="${accent}" opacity="${(0.25 + rand() * 0.45).toFixed(2)}"/>`,
	);
	return edges.join("") + dots.join("");
}

/**
 * Build one cover.
 *
 * @param {object} o
 * @param {string} o.slug      seed; same slug => same art
 * @param {string} o.title     rendered large, in mono
 * @param {string} o.category  shown as the top-left label
 * @param {string} [o.ctf]     optional CTF name, shown beside the category
 * @param {string} [o.date]    optional ISO date for the footer
 * @param {number} o.hue       category accent hue
 * @param {number} o.width
 * @param {number} o.height
 */
export function buildCover({
	slug,
	title,
	category,
	ctf = "",
	date = "",
	hue,
	width = 1280,
	height = 720,
}) {
	const rand = rngFor(slug);

	const accent = `hsl(${hue} 85% 68%)`;
	const accentDeep = `hsl(${hue} 80% 46%)`;
	const dim = "#8d93a8";
	const bg0 = "#07080c";
	const bg1 = `hsl(${hue} 32% 9%)`;

	const pad = Math.round(width * 0.062);
	const scale = width / 1280;

	// Glow sits in a different corner per post for variety.
	const glowX = (0.18 + rand() * 0.64) * width;
	const glowY = (0.08 + rand() * 0.3) * height;

	const titleSize = Math.round(
		(title.length > 34 ? 52 : title.length > 22 ? 62 : 72) * scale,
	);
	const titleLines = wrapMono(title, titleSize, width - pad * 2 - 20 * scale, 3);
	const lineHeight = titleSize * 1.22;

	// Title block is bottom-anchored so 1- and 3-line titles both sit well.
	const footerY = height - pad;
	const titleBaseline = footerY - 58 * scale - (titleLines.length - 1) * lineHeight;

	const hexSize = 15 * scale;
	const hexRows = Math.ceil((height * 0.55) / (hexSize * 1.55));

	const label = ctf ? `${category}  ·  ${ctf}` : category;

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="55%" stop-color="${bg0}"/>
      <stop offset="100%" stop-color="${bg0}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.30"/>
      <stop offset="55%" stop-color="${accentDeep}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="${accentDeep}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="62%" stop-color="#000" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.94"/>
    </linearGradient>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
    <pattern id="grid" width="${48 * scale}" height="${48 * scale}" patternUnits="userSpaceOnUse">
      <path d="M ${48 * scale} 0 L 0 0 0 ${48 * scale}" fill="none" stroke="#ffffff" stroke-opacity="0.028" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  <ellipse cx="${glowX.toFixed(0)}" cy="${glowY.toFixed(0)}" rx="${(width * 0.5).toFixed(0)}" ry="${(height * 0.5).toFixed(0)}" fill="url(#glow)"/>

  <g>
    ${hexField(rand, {
			x: pad,
			y: pad + 46 * scale,
			rows: hexRows,
			cols: 14,
			size: hexSize,
			lineHeight: hexSize * 1.55,
			hue,
			dim,
			lit: accent,
		})}
  </g>

  <g>
    ${nodeGraph(rand, {
			x: width * 0.62,
			y: height * 0.1,
			w: width * 0.32,
			h: height * 0.38,
			count: 11,
			accent,
		})}
  </g>

  <rect y="${height * 0.3}" width="${width}" height="${height * 0.7}" fill="url(#fade)"/>

  <!-- category / ctf label -->
  <g>
    <rect x="${pad}" y="${pad - 22 * scale}" width="${10 * scale}" height="${10 * scale}" fill="${accent}"/>
    <text x="${pad + 20 * scale}" y="${pad - 13 * scale}" font-family="JetBrains Mono" font-size="${16 * scale}" font-weight="600" letter-spacing="${2.4 * scale}" fill="${accent}">${esc(label.toUpperCase())}</text>
  </g>

  <!-- title -->
  <g>
    ${titleLines
			.map(
				(line, i) =>
					`<text x="${pad}" y="${(titleBaseline + i * lineHeight).toFixed(1)}" font-family="JetBrains Mono" font-size="${titleSize}" font-weight="700" fill="#ffffff" letter-spacing="${-1.2 * scale}">${esc(line)}</text>`,
			)
			.join("\n    ")}
  </g>

  <!-- footer -->
  <rect x="${pad}" y="${footerY - 34 * scale}" width="${width - pad * 2}" height="1.5" fill="url(#rule)"/>
  <text x="${pad}" y="${footerY - 6 * scale}" font-family="JetBrains Mono" font-size="${17 * scale}" font-weight="500" fill="#ffffff" opacity="0.82">vtnam207.github.io</text>
  ${
		date
			? `<text x="${width - pad}" y="${footerY - 6 * scale}" text-anchor="end" font-family="JetBrains Mono" font-size="${17 * scale}" fill="${dim}" opacity="0.7">${esc(date)}</text>`
			: ""
	}
</svg>`;
}

export { rngFor, wrapMono };
