/** Date and number formatting shared by cards, post headers and listings. */

const MONTHS_VI = [
	"Th01",
	"Th02",
	"Th03",
	"Th04",
	"Th05",
	"Th06",
	"Th07",
	"Th08",
	"Th09",
	"Th10",
	"Th11",
	"Th12",
];

/** "13 Th09 2026" — compact and unambiguous for a Vietnamese reader. */
export function formatDate(date: Date): string {
	const d = new Date(date);
	return `${d.getUTCDate()} ${MONTHS_VI[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "2026-09-13" — used in <time datetime> and mono metadata rows. */
export function isoDate(date: Date): string {
	return new Date(date).toISOString().slice(0, 10);
}

export function year(date: Date): number {
	return new Date(date).getUTCFullYear();
}

/** Words-per-minute estimate; code-heavy posts read slower than prose. */
export function readingTime(words: number): string {
	const minutes = Math.max(1, Math.round(words / 200));
	return `${minutes} phút đọc`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
	return `${n} ${n === 1 ? one : many}`;
}
