; brackets.scm — Bracket matching for Lava in Zed
;
; Node types match tree-sitter-lava grammar.js exactly.

; ───────────────────────────────────────────────────────
; Lava object delimiters: {{ }}
; ───────────────────────────────────────────────────────

(object
  open: (object_begin) @open
  close: (object_end) @close)

; ───────────────────────────────────────────────────────
; Lava tag delimiters: {% %}
; ───────────────────────────────────────────────────────

(tag
  open: (tag_begin) @open
  close: (tag_end) @close)

; ───────────────────────────────────────────────────────
; Lava shortcode delimiters: {[ ]}
; ───────────────────────────────────────────────────────

(shortcode
  open: (shortcode_begin) @open
  close: (shortcode_end) @close)

; ───────────────────────────────────────────────────────
; Shortcode item delimiters: [[ ]]
; ───────────────────────────────────────────────────────

(shortcode_item
  open: (shortcode_item_begin) @open
  close: (shortcode_item_end) @close)

; ───────────────────────────────────────────────────────
; Index access brackets
; ───────────────────────────────────────────────────────

(index_access
  (index_access_begin) @open
  (index_access_end) @close)

; ───────────────────────────────────────────────────────
; Range parentheses
; ───────────────────────────────────────────────────────

(range
  "(" @open
  ")" @close)
