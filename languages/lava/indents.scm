; indents.scm — Auto-indentation rules for Lava in Zed
;
; Node types match tree-sitter-lava grammar.js exactly.
; Since the grammar does not pair open/close tags (each {% ... %} is
; independent), indentation is driven by tag_name matching.

; ───────────────────────────────────────────────────────
; Opening tags — increase indent
; ───────────────────────────────────────────────────────

(tag
  name: (tag_name) @_name
  (#any-of? @_name
    "if" "unless" "case" "for" "tablerow"
    "capture" "cache" "personalize" "search"
    "webrequest" "calendarevents" "eventscheduledinstance"
    "interactionwrite" "paginate" "lava")
) @indent

; ───────────────────────────────────────────────────────
; Closing tags — decrease indent
; ───────────────────────────────────────────────────────

(tag
  name: (tag_name) @_name
  (#any-of? @_name
    "endif" "endunless" "endcase" "endfor" "endtablerow"
    "endcapture" "endcache" "endpersonalize" "endsearch"
    "endwebrequest" "endcalendarevents" "endeventscheduledinstance"
    "endinteractionwrite" "endpaginate")
) @end

; ───────────────────────────────────────────────────────
; Intermediate keywords — same level as opener
; ───────────────────────────────────────────────────────

(tag
  name: (tag_name) @_name
  (#any-of? @_name "else" "elseif" "when" "otherwise")
) @end @indent

; ───────────────────────────────────────────────────────
; Entity command tags — open/close pairs
; Tag names matching /^end/ decrease indent; others increase.
; ───────────────────────────────────────────────────────

(tag
  name: (tag_name) @_name
  (#match? @_name "^end[a-z]")
  (#not-any-of? @_name
    "endif" "endunless" "endcase" "endfor" "endtablerow"
    "endcapture" "endcache" "endpersonalize" "endsearch"
    "endwebrequest" "endcalendarevents" "endeventscheduledinstance"
    "endinteractionwrite" "endpaginate"
    "endraw" "endcomment"
    "endjavascript" "endstylesheet" "endsql" "endexecute")
) @end

; ───────────────────────────────────────────────────────
; Embedded blocks — paired open/close
; ───────────────────────────────────────────────────────

(javascript_block) @indent @end
(stylesheet_block) @indent @end
(sql_block) @indent @end
(csharp_block) @indent @end
(comment_block) @indent @end
(raw_block) @indent @end

; ───────────────────────────────────────────────────────
; Shortcodes
; ───────────────────────────────────────────────────────

(shortcode
  name: (shortcode_name) @_name
  (#not-match? @_name "^end")
) @indent

(shortcode
  name: (shortcode_name) @_name
  (#match? @_name "^end")
) @end
