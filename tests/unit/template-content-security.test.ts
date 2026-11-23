import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  escapeHtmlText,
  sanitizeTemplateCss,
  sanitizeTemplateHtml,
  TEMPLATE_TEXT_LIMITS,
} from "../../services/templateContentSecurity";

describe("template content security", () => {
  it("escapes every HTML-significant character in interpolated text", () => {
    assert.equal(
      escapeHtmlText(`<img src="x" onerror='alert(1)'>&`),
      "&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt;&amp;",
    );
  });

  it("defines bounded title and taxonomy lengths", () => {
    assert.equal(TEMPLATE_TEXT_LIMITS.title, 200);
    assert.equal(TEMPLATE_TEXT_LIMITS.taxonomyName, 120);
  });

  it("removes executable tags and event handlers", () => {
    const output = sanitizeTemplateHtml(
      '<div onclick="alert(1)"><script>alert(1)</script><img src=x onerror="alert(2)"><p>Safe</p></div>',
    );

    assert.match(output, /<div><p>Safe<\/p><\/div>/);
    assert.doesNotMatch(output, /script|onclick|onerror|<img/i);
  });

  it("removes active URL attributes including javascript and srcset", () => {
    const output = sanitizeTemplateHtml(
      '<a href="javascript:alert(1)">Link</a><img srcset="https://attacker.example/x 1x"><p cite="file:///etc/passwd">Text</p>',
    );

    assert.equal(output, "Link<p>Text</p>");
    assert.doesNotMatch(output, /javascript:|file:|https:|href|srcset|cite/i);
  });

  it("discards SVG, MathML, forms, frames and document-control tags", () => {
    const output = sanitizeTemplateHtml(
      '<svg><script>alert(1)</script><circle></circle></svg><math><mtext><img src=x onerror=alert(1)></mtext></math><form><input></form><iframe src="https://attacker.example"></iframe><meta http-equiv="refresh" content="0;url=javascript:alert(1)"><base href="https://attacker.example"><p>Kept</p>',
    );

    assert.equal(output, "<p>Kept</p>");
  });

  it("preserves document text, placeholders, tables and safe inline styles", () => {
    const output = sanitizeTemplateHtml(
      '<section class="page" dir="rtl"><h1 style="text-align:center;color:#111827">{{client.fullName}}</h1><table><tbody><tr><th scope="col">Label</th><td colspan="2"><strong>Value</strong></td></tr></tbody></table></section>',
    );

    assert.match(output, /<section class="page" dir="rtl">/);
    assert.match(output, /\{\{client\.fullName\}\}/);
    assert.match(output, /style="text-align:center;color:#111827"/);
    assert.match(output, /<table><tbody><tr><th scope="col">Label<\/th><td colspan="2"><strong>Value<\/strong><\/td><\/tr><\/tbody><\/table>/);
  });

  it("rejects CSS URL, import, expression and behavior primitives", () => {
    const payloads = [
      '.page { background-image: url("https://attacker.example/x"); }',
      '@import "https://attacker.example/x.css";',
      ".page { width: expression(alert(1)); }",
      ".page { behavior: url(x.htc); }",
      ".page { background: u\\72l(file:///etc/passwd); }",
    ];

    for (const payload of payloads) {
      assert.equal(sanitizeTemplateCss(payload), "");
    }
  });

  it("keeps a conservative document stylesheet and drops unknown properties", () => {
    const output = sanitizeTemplateCss(
      'body { direction: rtl; font-family: "Tajawal", Arial, sans-serif; color: #111827; position: fixed; } .page { padding: 24px 32px; } table { width: 100%; border-collapse: collapse; }',
    );

    assert.match(output, /body \{[^}]*direction:rtl/);
    assert.match(output, /font-family:"Tajawal",\s*Arial,\s*sans-serif/);
    assert.match(output, /\.page \{ padding:24px 32px \}/);
    assert.match(output, /table \{ width:100%;border-collapse:collapse \}/);
    assert.doesNotMatch(output, /position/);
  });
});
