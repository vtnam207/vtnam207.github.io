import { visit } from "unist-util-visit";

/** Alt text that carries no information — HackMD's default is "image". */
const PLACEHOLDER_ALT = /^(image|img|screenshot|photo|picture)?$/i;

/**
 * Post-processes rendered markdown:
 *  - a paragraph holding only an image becomes a <figure> (zoomable, with a
 *    caption when the alt text is meaningful);
 *  - every image is lazy-loaded;
 *  - a paragraph holding only a formula is styled as display math;
 *  - tables are wrapped so wide ones scroll instead of breaking the layout.
 */
export function rehypeFigures() {
	return (tree) => {
		visit(tree, "element", (node, index, parent) => {
			if (!parent || index === undefined) return;

			if (node.tagName === "img") {
				node.properties.loading ??= "lazy";
				node.properties.decoding ??= "async";
			}

			if (node.tagName === "p") {
				const meaningful = node.children.filter(
					(c) => !(c.type === "text" && !c.value.trim()),
				);
				// `$$ x $$` written on one line parses as inline math; when it's
				// alone in its paragraph the author meant a display formula.
				const only = meaningful.length === 1 ? meaningful[0] : null;
				if (
					only?.tagName === "span" &&
					only.properties?.className?.includes("katex")
				) {
					node.properties.className = [
						...(node.properties.className ?? []),
						"math-block",
					];
					return;
				}
				if (meaningful.length === 1 && meaningful[0].tagName === "img") {
					const img = meaningful[0];
					img.properties.loading ??= "lazy";
					img.properties.decoding ??= "async";
					const alt = String(img.properties.alt ?? "").trim();
					const children = [img];
					if (!PLACEHOLDER_ALT.test(alt)) {
						children.push({
							type: "element",
							tagName: "figcaption",
							properties: {},
							children: [{ type: "text", value: alt }],
						});
					}
					parent.children[index] = {
						type: "element",
						tagName: "figure",
						properties: { className: ["zoomable"] },
						children,
					};
				}
			}

			if (
				node.tagName === "table" &&
				parent.properties?.className?.[0] !== "table-scroll"
			) {
				parent.children[index] = {
					type: "element",
					tagName: "div",
					properties: { className: ["table-scroll"] },
					children: [node],
				};
			}
		});
	};
}
