import sanitizeHtml from "sanitize-html";

export const TEMPLATE_TEXT_LIMITS = {
  title: 200,
  taxonomyName: 120,
} as const;

export const TEMPLATE_CONTENT_LIMITS = {
  html: 1_000_000,
  css: 200_000,
} as const;

const ALLOWED_TAGS = [
  "html",
  "head",
  "body",
  "address",
  "article",
  "aside",
  "footer",
  "header",
  "main",
  "section",
  "blockquote",
  "div",
  "figure",
  "figcaption",
  "hr",
  "p",
  "pre",
  "br",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ol",
  "ul",
  "li",
  "b",
  "bdi",
  "bdo",
  "cite",
  "code",
  "em",
  "i",
  "kbd",
  "mark",
  "q",
  "s",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "time",
  "u",
  "var",
  "wbr",
  "caption",
  "col",
  "colgroup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
];

const LENGTH_VALUE = /^-?(?:0|\d+(?:\.\d+)?(?:px|pt|pc|cm|mm|in|em|rem|%|vh|vw))(?:\s+-?(?:0|\d+(?:\.\d+)?(?:px|pt|pc|cm|mm|in|em|rem|%|vh|vw))){0,3}$/i;
const COLOR_VALUE = /^(?:transparent|currentcolor|black|white|gray|grey|red|green|blue|navy|maroon|purple|teal|olive|silver|yellow|#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([\d\s.,%+-]+\))$/i;
const FONT_FAMILY_VALUE = /^[\p{L}\p{N}\s"',_-]+$/u;
const BORDER_VALUE = /^(?:0|(?:\d+(?:\.\d+)?(?:px|pt|cm|mm))\s+(?:none|solid|dashed|dotted|double)\s+(?:transparent|currentcolor|black|white|gray|grey|red|green|blue|#[0-9a-f]{3,8}))$/i;
const GRID_VALUE = /^(?:none|[\d\s.%a-z(),+-]+)$/i;

const ALLOWED_STYLES: sanitizeHtml.IOptions["allowedStyles"] = {
  "*": {
    color: [COLOR_VALUE],
    "background-color": [COLOR_VALUE],
    "font-family": [FONT_FAMILY_VALUE],
    "font-size": [LENGTH_VALUE],
    "font-style": [/^(?:normal|italic|oblique)$/i],
    "font-weight": [/^(?:normal|bold|bolder|lighter|[1-9]00)$/i],
    "line-height": [/^(?:normal|\d+(?:\.\d+)?|\d+(?:\.\d+)?(?:px|pt|cm|mm|em|rem|%))$/i],
    "text-align": [/^(?:start|end|left|right|center|justify)$/i],
    "text-decoration": [/^(?:none|underline|overline|line-through)$/i],
    direction: [/^(?:ltr|rtl)$/i],
    "unicode-bidi": [/^(?:normal|embed|bidi-override|isolate|isolate-override|plaintext)$/i],
    "white-space": [/^(?:normal|nowrap|pre|pre-wrap|pre-line|break-spaces)$/i],
    "word-break": [/^(?:normal|break-all|keep-all|break-word)$/i],
    "overflow-wrap": [/^(?:normal|break-word|anywhere)$/i],
    display: [/^(?:none|block|inline|inline-block|flex|inline-flex|grid|inline-grid|table|table-row|table-cell)$/i],
    "justify-content": [/^(?:normal|start|end|center|space-between|space-around|space-evenly|flex-start|flex-end)$/i],
    "align-items": [/^(?:normal|stretch|start|end|center|baseline|flex-start|flex-end)$/i],
    "grid-template-columns": [GRID_VALUE],
    gap: [LENGTH_VALUE],
    width: [LENGTH_VALUE, /^(?:auto|fit-content|max-content|min-content)$/i],
    "min-width": [LENGTH_VALUE, /^(?:auto|fit-content|max-content|min-content)$/i],
    "max-width": [LENGTH_VALUE, /^(?:none|fit-content|max-content|min-content)$/i],
    height: [LENGTH_VALUE, /^(?:auto|fit-content|max-content|min-content)$/i],
    "min-height": [LENGTH_VALUE, /^(?:auto|fit-content|max-content|min-content)$/i],
    "max-height": [LENGTH_VALUE, /^(?:none|fit-content|max-content|min-content)$/i],
    margin: [LENGTH_VALUE],
    "margin-top": [LENGTH_VALUE],
    "margin-right": [LENGTH_VALUE],
    "margin-bottom": [LENGTH_VALUE],
    "margin-left": [LENGTH_VALUE],
    padding: [LENGTH_VALUE],
    "padding-top": [LENGTH_VALUE],
    "padding-right": [LENGTH_VALUE],
    "padding-bottom": [LENGTH_VALUE],
    "padding-left": [LENGTH_VALUE],
    border: [BORDER_VALUE],
    "border-top": [BORDER_VALUE],
    "border-right": [BORDER_VALUE],
    "border-bottom": [BORDER_VALUE],
    "border-left": [BORDER_VALUE],
    "border-collapse": [/^(?:collapse|separate)$/i],
    "border-spacing": [LENGTH_VALUE],
    "vertical-align": [/^(?:baseline|sub|super|text-top|text-bottom|middle|top|bottom)$/i, LENGTH_VALUE],
    "list-style-type": [/^(?:none|disc|circle|square|decimal|lower-alpha|upper-alpha|lower-roman|upper-roman)$/i],
    "page-break-before": [/^(?:auto|always|avoid|left|right)$/i],
    "page-break-after": [/^(?:auto|always|avoid|left|right)$/i],
    "page-break-inside": [/^(?:auto|avoid)$/i],
    "break-before": [/^(?:auto|avoid|page|left|right)$/i],
    "break-after": [/^(?:auto|avoid|page|left|right)$/i],
    "break-inside": [/^(?:auto|avoid)$/i],
  },
};

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    "*": ["class", "id", "dir", "lang", "title", "style"],
    col: ["span"],
    colgroup: ["span"],
    ol: ["start", "type", "reversed"],
    li: ["value"],
    td: ["colspan", "rowspan", "headers"],
    th: ["colspan", "rowspan", "headers", "scope"],
    time: ["datetime"],
  },
  allowedStyles: ALLOWED_STYLES,
  allowedSchemes: [],
  allowedSchemesByTag: {},
  allowedSchemesAppliedToAttributes: [
    "href",
    "src",
    "srcset",
    "imagesrcset",
    "cite",
    "action",
    "formaction",
    "data",
    "xlink:href",
    "poster",
    "background",
  ],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  nestingLimit: 20,
  parseStyleAttributes: true,
};

const CSS_RULE_PATTERN = /([^{}]+)\{([^{}]*)\}/g;
const SAFE_SELECTOR = /^[\p{L}\p{N}_.#*,:>\s-]+$/u;

function decodeCssEscapes(value: string) {
  return value
    .replace(/\\([0-9a-f]{1,6})\s?/gi, (_, hex: string) => {
      const codePoint = Number.parseInt(hex, 16);
      return Number.isSafeInteger(codePoint) && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : "";
    })
    .replace(/\\([\s\S])/g, "$1");
}

function hasForbiddenCssConstruct(value: string) {
  const canonical = decodeCssEscapes(value.replace(/\/\*[\s\S]*?\*\//g, ""))
    .toLowerCase()
    .replace(/\s+/g, "");

  return /@|url\(|expression\(|behavior:|-moz-binding:|javascript:|vbscript:|file:|data:/i.test(
    canonical,
  );
}

function decodeHtmlAttribute(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function sanitizeCssDeclarations(value: string) {
  const escaped = escapeHtmlText(value);
  const sanitized = sanitizeHtml(`<div style="${escaped}"></div>`, {
    ...SANITIZE_OPTIONS,
    allowedTags: ["div"],
  });
  const match = sanitized.match(/\sstyle="([^"]*)"/);
  return match?.[1] ? decodeHtmlAttribute(match[1]).trim() : "";
}

export function escapeHtmlText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeTemplateHtml(value: string) {
  if (value.length > TEMPLATE_CONTENT_LIMITS.html) {
    throw new RangeError("Template HTML exceeds the supported size");
  }
  return sanitizeHtml(value, SANITIZE_OPTIONS);
}

export function sanitizeTemplateCss(value: string) {
  if (value.length > TEMPLATE_CONTENT_LIMITS.css) {
    throw new RangeError("Template CSS exceeds the supported size");
  }
  if (!value.trim() || hasForbiddenCssConstruct(value)) {
    return "";
  }

  const withoutComments = value.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: string[] = [];
  let cursor = 0;

  for (const match of withoutComments.matchAll(CSS_RULE_PATTERN)) {
    const index = match.index ?? 0;
    if (withoutComments.slice(cursor, index).trim()) return "";

    const selector = match[1]?.trim() ?? "";
    const declarations = match[2] ?? "";
    if (!selector || !SAFE_SELECTOR.test(selector)) return "";

    const sanitizedDeclarations = sanitizeCssDeclarations(declarations);
    if (sanitizedDeclarations) {
      rules.push(`${selector} { ${sanitizedDeclarations} }`);
    }
    cursor = index + match[0].length;
  }

  if (withoutComments.slice(cursor).trim()) return "";
  return rules.join("\n");
}

export function sanitizeTemplateContent(
  contentHtml: string | null | undefined,
  contentCss: string | null | undefined,
) {
  return {
    contentHtml:
      contentHtml === undefined
        ? undefined
        : contentHtml === null
          ? null
          : sanitizeTemplateHtml(contentHtml),
    contentCss:
      contentCss === undefined
        ? undefined
        : contentCss === null
          ? null
          : sanitizeTemplateCss(contentCss),
  };
}
