/// <reference types="mdast" />
import { h } from "hastscript";

const COLORS = {
	note: "hsl(215 90% 66%)",
	tip: "hsl(150 65% 52%)",
	important: "hsl(265 89% 72%)",
	warning: "hsl(38 95% 58%)",
	caution: "hsl(0 85% 64%)",
};

/**
 * Renders `:::note` / `> [!TIP]` style blocks.
 *
 * @param {Record<string, unknown>} properties
 * @param {import('hast').ElementContent[]} children
 * @param {keyof typeof COLORS} type
 */
export function AdmonitionComponent(properties, children, type) {
	if (!Array.isArray(children) || children.length === 0) {
		return h("div", { class: "hidden" }, "Invalid admonition directive.");
	}

	let label = null;
	let body = children;
	if (properties?.["has-directive-label"]) {
		label = children[0];
		body = children.slice(1);
		label.tagName = "div";
	}

	return h(
		"aside",
		{
			class: `admonition admonition-${type}`,
			style: `--admonition-color: ${COLORS[type]}`,
		},
		[
			h("div", { class: "admonition-title" }, label ? label.children : type),
			...body,
		],
	);
}
