"use client";

const ALLOWED_TEXT_COLORS = new Set([
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#7c3aed",
  "#22d3ee",
  "#a3e635",
  "#facc15",
  "#f472b6",
]);

const RICH_TEXT_WRAPPER_CLASS = "text me-rich-text";

export function normalizePlainTextForComparison(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
    return ALLOWED_TEXT_COLORS.has(hex) ? hex : null;
  }

  if (ALLOWED_TEXT_COLORS.has(value)) return value;
  return null;
}

function pushInlineBreak(buffer: string[]) {
  if (buffer.length === 0) return;
  const last = buffer[buffer.length - 1];
  if (last === "<br>") return;
  buffer.push("<br>");
}

function collectPlainText(root: ParentNode) {
  const parts: string[] = [];

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push(node.textContent ?? "");
      return;
    }

    if (!(node instanceof HTMLElement)) return;

    if (node.tagName === "BR") {
      parts.push("\n");
      return;
    }

    const isBlock = node.tagName === "P" || node.tagName === "DIV";
    if (isBlock && parts.length > 0 && parts[parts.length - 1] !== "\n") {
      parts.push("\n");
    }

    node.childNodes.forEach((child) => walk(child));

    if (isBlock && parts.length > 0 && parts[parts.length - 1] !== "\n") {
      parts.push("\n");
    }
  };

  root.childNodes.forEach((child) => walk(child));

  return normalizePlainTextForComparison(parts.join("").replace(/\s*\n\s*/g, " "));
}

function sanitizeNode(node: Node): { html: string; hasFormatting: boolean } {
  if (node.nodeType === Node.TEXT_NODE) {
    return {
      html: escapeHtml(node.textContent ?? ""),
      hasFormatting: false,
    };
  }

  if (!(node instanceof HTMLElement)) {
    return { html: "", hasFormatting: false };
  }

  if (node.tagName === "BR") {
    return { html: "<br>", hasFormatting: false };
  }

  const tag = node.tagName.toLowerCase();

  if (tag === "p" || tag === "div") {
    const inlineParts: string[] = [];
    let hasFormatting = false;

    node.childNodes.forEach((child) => {
      const result = sanitizeNode(child);
      if (result.html) {
        inlineParts.push(result.html);
      }
      if (result.hasFormatting) {
        hasFormatting = true;
      }
    });

    while (inlineParts[inlineParts.length - 1] === "<br>") {
      inlineParts.pop();
    }

    return {
      html: inlineParts.join("") + (inlineParts.length > 0 ? "<br>" : ""),
      hasFormatting,
    };
  }

  if (tag === "strong" || tag === "b") {
    const inner = sanitizeNodeList(node);
    if (!inner.html) return { html: "", hasFormatting: inner.hasFormatting };
    return {
      html: `<strong>${inner.html}</strong>`,
      hasFormatting: true,
    };
  }

  if (tag === "span") {
    const inner = sanitizeNodeList(node);
    if (!inner.html) return { html: "", hasFormatting: inner.hasFormatting };

    const color = normalizeColorValue(node.style.color);
    if (!color) {
      return inner;
    }

    return {
      html: `<span style="color: ${color};">${inner.html}</span>`,
      hasFormatting: true,
    };
  }

  return sanitizeNodeList(node);
}

function sanitizeNodeList(root: ParentNode) {
  const htmlParts: string[] = [];
  let hasFormatting = false;

  const walk = (node: Node) => {
    const result = sanitizeNode(node);
    if (!result.html) return;
    if (result.html === "<br>") {
      pushInlineBreak(htmlParts);
    } else {
      htmlParts.push(result.html);
    }
    if (result.hasFormatting) {
      hasFormatting = true;
    }
  };

  root.childNodes.forEach((child) => walk(child));

  while (htmlParts[htmlParts.length - 1] === "<br>") {
    htmlParts.pop();
  }

  const html = htmlParts.join("");
  return { html, hasFormatting };
}

export function buildStoredRichTextHtml(innerHtml: string) {
  return `<span class="${RICH_TEXT_WRAPPER_CLASS}" data-rich-text="true">${innerHtml}</span>`;
}

export function getStoredRichTextInnerHtml(rawHtml: string | null | undefined) {
  const value = String(rawHtml ?? "").trim();
  if (!value || typeof DOMParser === "undefined") return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(value, "text/html");
  const wrapper =
    doc.body.querySelector<HTMLElement>("[data-rich-text='true']") ??
    doc.body.querySelector<HTMLElement>(".me-rich-text") ??
    doc.body.querySelector<HTMLElement>(".text");

  return (wrapper?.innerHTML ?? doc.body.innerHTML ?? "").trim();
}

export function plainTextToEditorHtml(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  if (!text) return "<p></p>";
  return `<p>${escapeHtml(text).replace(/\r?\n/g, "<br>")}</p>`;
}

export function sanitizeRichTextInputHtml(rawHtml: string) {
  if (typeof DOMParser === "undefined") {
    const plainText = String(rawHtml ?? "")
      .replace(/\s+/g, " ")
      .trim();
    return {
      topic: plainText,
      innerHtml: escapeHtml(plainText),
      storedHtml: plainText ? buildStoredRichTextHtml(escapeHtml(plainText)) : null,
      hasRichFormatting: false,
    };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${rawHtml}</div>`, "text/html");
  const root = doc.body.firstElementChild ?? doc.body;

  const { html, hasFormatting } = sanitizeNodeList(root);
  const topic = collectPlainText(root);
  const hasLineBreaks = html.includes("<br>");
  const storedHtml =
    html && (hasFormatting || hasLineBreaks) ? buildStoredRichTextHtml(html) : null;

  return {
    topic,
    innerHtml: html,
    storedHtml,
    hasRichFormatting: hasFormatting || hasLineBreaks,
  };
}

export function isStoredRichTextHtml(value: string | null | undefined) {
  return String(value ?? "").includes('data-rich-text="true"');
}
