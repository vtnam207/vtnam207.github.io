/**
 * Single source of truth for everything that is "about Nam" rather than
 * "about the blog engine". Pages read from here; nothing hardcodes a name.
 */

export interface SocialLink {
	name: string;
	/** Key into the <Icon> component's sprite. */
	icon: string;
	url: string;
	/** Shown instead of the URL in the contact list. */
	handle: string;
}

export const site = {
	title: "Vũ Thành Nam",
	shortTitle: "vtnam207",
	tagline: "Reverse engineering, CTF write-ups, and low-level notes.",
	description:
		"Blog cá nhân của Vũ Thành Nam — sinh viên UIT (ĐHQG-HCM). Write-up CTF, reverse engineering, crypto và ghi chú lập trình hệ thống.",
	url: "https://vtnam207.github.io",
	lang: "vi",
	locale: "vi_VN",
	/** Posts shown per page on the archive-style listings. */
	postsPerPage: 12,
} as const;

export const author = {
	name: "Vũ Thành Nam",
	handle: "vtnam207",
	avatar: "/assets/images/avatar-vtnam.webp",
	role: "Reverse Engineering · CTF Player",
	school: "University of Information Technology, VNU-HCM",
	schoolShort: "UIT — VNUHCM",
	schoolUrl: "https://www.uit.edu.vn/",
	location: "Ho Chi Minh City, Vietnam",
	status: "Đang học tại UIT — VNUHCM",
	bio: "Mình là Nam, sinh viên UIT (ĐHQG-HCM). Mình chơi CTF ở mảng reverse engineering và viết lại những gì học được: cách tháo rời một binary, bẻ một thuật toán, và vì sao nó hỏng.",
	bioEn:
		"I'm Nam, a student at UIT (VNU-HCM). I play CTF on the reverse engineering side and write up what I learn: how to take a binary apart, break an algorithm, and understand why it failed.",
	motto: "Better to be curious than certain.",
	/** Rendered as the typing line in the hero terminal. */
	focus: [
		"Reverse Engineering",
		"Binary Analysis",
		"Cryptography",
		"Low-level Programming",
	],
} as const;

export const socials: SocialLink[] = [
	{
		name: "GitHub",
		icon: "github",
		url: "https://github.com/vtnam207",
		handle: "vtnam207",
	},
	{
		name: "Facebook",
		icon: "facebook",
		url: "https://www.facebook.com/vtn261207",
		handle: "vtn261207",
	},
	{
		name: "Discord",
		icon: "discord",
		url: "https://discord.com/users/835426848145408020",
		handle: "vtnam207",
	},
	{
		name: "HackMD",
		icon: "hackmd",
		url: "https://hackmd.io/@vtnam207",
		handle: "@vtnam207",
	},
];

export const nav = [
	{ label: "Home", href: "/" },
	{ label: "Blog", href: "/blog/" },
	{ label: "Write-ups", href: "/writeups/" },
	{ label: "Archive", href: "/archive/" },
	{ label: "About", href: "/about/" },
];

export const license = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
} as const;

/**
 * Category -> accent. Drives chip colour, cover art and the post header glow,
 * so a category always looks the same everywhere on the site.
 */
export const categoryTheme: Record<string, { hue: number; label: string }> = {
	"Reverse Engineering": { hue: 265, label: "rev" },
	Crypto: { hue: 185, label: "crypto" },
	Pwn: { hue: 12, label: "pwn" },
	Web: { hue: 150, label: "web" },
	Forensics: { hue: 45, label: "forensics" },
	Notes: { hue: 220, label: "notes" },
};

export const defaultCategoryTheme = { hue: 265, label: "post" };

export function themeForCategory(category?: string | null) {
	if (!category) return defaultCategoryTheme;
	return categoryTheme[category] ?? defaultCategoryTheme;
}
