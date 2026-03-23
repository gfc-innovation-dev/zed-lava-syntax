; injections.scm — Embedded language injections for Lava in Zed
;
; Node types match tree-sitter-lava grammar.js exactly.
; Injects parsers for embedded languages inside Lava blocks,
; and HTML for content between Lava constructs.

; ───────────────────────────────────────────────────────
; HTML: content nodes (text between Lava constructs)
; ───────────────────────────────────────────────────────

((content) @injection.content
  (#set! injection.language "html")
  (#set! injection.combined))

; ───────────────────────────────────────────────────────
; JavaScript: {% javascript %}...{% endjavascript %}
; ───────────────────────────────────────────────────────

(javascript_block
  content: (block_content) @injection.content
  (#set! injection.language "javascript")
  (#set! injection.combined))

; ───────────────────────────────────────────────────────
; CSS: {% stylesheet %}...{% endstylesheet %}
; ───────────────────────────────────────────────────────

(stylesheet_block
  content: (block_content) @injection.content
  (#set! injection.language "css")
  (#set! injection.combined))

; ───────────────────────────────────────────────────────
; SQL: {% sql ... %}...{% endsql %}
; ───────────────────────────────────────────────────────

(sql_block
  content: (block_content) @injection.content
  (#set! injection.language "sql")
  (#set! injection.combined))

; ───────────────────────────────────────────────────────
; C#: {% execute %}...{% endexecute %}
; ───────────────────────────────────────────────────────

(csharp_block
  content: (block_content) @injection.content
  (#set! injection.language "c_sharp")
  (#set! injection.combined))

; ───────────────────────────────────────────────────────
; YAML frontmatter: {% comment %}---\n...\n---{% endcomment %}
; ───────────────────────────────────────────────────────

(frontmatter
  content: (frontmatter_content) @injection.content
  (#set! injection.language "yaml")
  (#set! injection.combined))
