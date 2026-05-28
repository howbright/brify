export type SlideshowNode = {
  id: string;
  topic?: string | null;
  dangerouslySetInnerHTML?: string | null;
  image?: {
    url: string;
    width?: number;
    height?: number;
    fit?: "fill" | "contain" | "cover";
  } | null;
  highlight?: { variant?: string } | null;
  note?: string | null;
  children?: SlideshowNode[];
};

export type SlideItem = {
  id: string;
  nodeId: string;
  kind: "normal" | "recap";
  title: string;
  titleHtml: string | null;
  depth: number;
  path: string[];
  highlightVariant: string | null;
  image: {
    url: string;
    width?: number;
    height?: number;
    fit?: "fill" | "contain" | "cover";
  } | null;
  note: string | null;
  children: Array<{
    id: string;
    title: string;
    titleHtml: string | null;
    highlightVariant: string | null;
    hasChildren: boolean;
    childCount: number;
  }>;
};

const ALLOWED_SLIDE_TEXT_COLORS = new Set([
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#7c3aed",
  "#22d3ee",
  "#a3e635",
  "#facc15",
  "#f472b6",
]);

function decodeHtmlEntities(value: string) {
  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = value;
    return textarea.value;
  }
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function getNodePlainText(node: SlideshowNode | null | undefined) {
  const source = node?.dangerouslySetInnerHTML || node?.topic || "";
  const withoutTags = String(source)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]*>/g, "");
  const normalized = decodeHtmlEntities(withoutTags).replace(/\s+/g, " ").trim();
  return normalized || "Untitled";
}

function normalizeColorValue(raw: string | null | undefined) {
  const value = String(raw ?? "").trim().toLowerCase();
  if (!value) return null;

  const rgb = value.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+\s*)?\)$/
  );
  if (rgb) {
    const [r, g, b] = rgb.slice(1, 4).map((part) =>
      Math.max(0, Math.min(255, Number(part)))
    );
    const hex = `#${[r, g, b]
      .map((part) => part.toString(16).padStart(2, "0"))
      .join("")}`;
    return ALLOWED_SLIDE_TEXT_COLORS.has(hex) ? hex : null;
  }

  return ALLOWED_SLIDE_TEXT_COLORS.has(value) ? value : null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeColoredTitleHtml(rawHtml: string | null | undefined) {
  const value = String(rawHtml ?? "").trim();
  if (!value || typeof DOMParser === "undefined") return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(value, "text/html");
  const wrapper =
    doc.body.querySelector<HTMLElement>("[data-rich-text='true']") ??
    doc.body.querySelector<HTMLElement>(".me-rich-text") ??
    doc.body.querySelector<HTMLElement>(".text") ??
    doc.body;

  let hasColor = false;

  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeHtml(node.textContent ?? "");
    }

    if (!(node instanceof HTMLElement)) return "";

    if (node.tagName === "BR") return " ";

    const inner = Array.from(node.childNodes).map(walk).join("");
    if (!inner) return "";

    const color = node.tagName.toLowerCase() === "span"
      ? normalizeColorValue(node.style.color)
      : null;

    if (!color) return inner;

    hasColor = true;
    return `<span style="color: ${color};">${inner}</span>`;
  };

  const html = Array.from(wrapper.childNodes).map(walk).join("").replace(/\s+/g, " ").trim();
  return hasColor && html ? html : null;
}

export function buildDfsSlides(root: SlideshowNode): SlideItem[] {
  const slides: SlideItem[] = [];

  function shouldCreateOwnSlide(node: SlideshowNode) {
    return Boolean(
      node.children?.length ||
        node.image?.url ||
        node.note?.trim() ||
        node.highlight?.variant
    );
  }

  function createSlide(
    node: SlideshowNode,
    depth: number,
    parentPath: string[],
    kind: SlideItem["kind"] = "normal"
  ): SlideItem {
    const title = getNodePlainText(node);
    const children = Array.isArray(node.children) ? node.children : [];
    const path = [...parentPath, title];

    return {
      id: kind === "recap" ? `${node.id}:recap` : node.id,
      nodeId: node.id,
      kind,
      title,
      titleHtml: sanitizeColoredTitleHtml(node.dangerouslySetInnerHTML),
      depth,
      path,
      highlightVariant: node.highlight?.variant ?? null,
      image: node.image?.url
        ? {
            url: node.image.url,
            width: node.image.width,
            height: node.image.height,
            fit: node.image.fit,
          }
        : null,
      note: node.note?.trim() ? node.note.trim() : null,
      children: children.map((child) => ({
        id: child.id,
        title: getNodePlainText(child),
        titleHtml: sanitizeColoredTitleHtml(child.dangerouslySetInnerHTML),
        highlightVariant: child.highlight?.variant ?? null,
        hasChildren: Boolean(child.children?.length),
        childCount: child.children?.length ?? 0,
      })),
    };
  }

  function visit(node: SlideshowNode, depth: number, parentPath: string[]) {
    const slide = createSlide(node, depth, parentPath);
    const children = Array.isArray(node.children) ? node.children : [];
    const recapTargets = children.filter(shouldCreateOwnSlide);

    slides.push(slide);

    for (const child of recapTargets) {
      visit(child, depth + 1, slide.path);
    }

    if (recapTargets.length > 0) {
      slides.push(createSlide(node, depth, parentPath, "recap"));
    }
  }

  visit(root, 0, []);
  return slides;
}
