; highlights.scm — Lava syntax highlighting for Zed
;
; Node types match tree-sitter-lava grammar.js exactly.
; See grammar.js for the full node type reference.

; ───────────────────────────────────────────────────────
; Comments
; ───────────────────────────────────────────────────────

(comment_block) @comment
(line_comment) @comment
(block_comment_alt) @comment

; ───────────────────────────────────────────────────────
; Lava Delimiters — punctuation for objects and tags
; ───────────────────────────────────────────────────────

(object_begin) @punctuation.bracket
(object_end) @punctuation.bracket

(tag
  open: (tag_begin) @punctuation.bracket)
(tag
  close: (tag_end) @punctuation.bracket)

(shortcode_begin) @punctuation.bracket
(shortcode_end) @punctuation.bracket
(shortcode_item_begin) @punctuation.bracket
(shortcode_item_end) @punctuation.bracket

; ───────────────────────────────────────────────────────
; Tag Names — control flow keywords
; ───────────────────────────────────────────────────────

; Conditionals
(tag
  name: (tag_name) @keyword
  (#any-of? @keyword
    "if" "elseif" "unless" "endif" "endunless"
    "case" "when" "endcase"))

; Loops
(tag
  name: (tag_name) @keyword
  (#any-of? @keyword
    "for" "endfor" "tablerow" "endtablerow"
    "break" "continue"))

; General control
(tag
  name: (tag_name) @keyword
  (#any-of? @keyword
    "else" "return" "paginate" "endpaginate"))

; Variable assignment
(tag
  name: (tag_name) @keyword
  (#any-of? @keyword
    "assign" "capture" "endcapture" "echo"
    "increment" "decrement"))

; Include / render — function-like
(tag
  name: (tag_name) @function
  (#any-of? @function "render" "include"))

; Raw / comment tags
(tag
  name: (tag_name) @keyword
  (#any-of? @keyword "raw" "endraw" "comment" "endcomment"))

; Embedded language tags
(tag
  name: (tag_name) @keyword
  (#any-of? @keyword
    "javascript" "endjavascript"
    "stylesheet" "endstylesheet"
    "sql" "endsql"
    "execute" "endexecute"))

; Rock block tags
(tag
  name: (tag_name) @keyword
  (#any-of? @keyword
    "cache" "endcache"
    "personalize" "endpersonalize" "otherwise"
    "webrequest" "endwebrequest"
    "search" "endsearch"
    "calendarevents" "endcalendarevents"
    "eventscheduledinstance" "endeventscheduledinstance"
    "interactionwrite" "endinteractionwrite"
    "interactioncontentchannelitemwrite"
    "lava"))

; Tag names inside comment/raw/embedded blocks
(comment_block (tag_name) @keyword)
(raw_block (tag_name) @keyword)
(javascript_block (tag_name) @keyword)
(stylesheet_block (tag_name) @keyword)
(sql_block (tag_name) @keyword)
(csharp_block (tag_name) @keyword)

; Catch-all: any other tag_name in a tag (entity commands, etc.)
(tag
  name: (tag_name) @keyword)

; ───────────────────────────────────────────────────────
; Filters
; ───────────────────────────────────────────────────────

(filter
  pipe: (pipe) @punctuation.delimiter)

(filter
  name: (filter_name) @function)

; ───────────────────────────────────────────────────────
; Operators
; ───────────────────────────────────────────────────────

(operator) @operator
(assignment_operator) @operator
(word_operator) @keyword.operator
(range_operator) @operator

; ───────────────────────────────────────────────────────
; Strings
; ───────────────────────────────────────────────────────

(string_single) @string
(string_double) @string

; ───────────────────────────────────────────────────────
; Numbers
; ───────────────────────────────────────────────────────

(number) @number

; ───────────────────────────────────────────────────────
; Constants
; ───────────────────────────────────────────────────────

(boolean) @constant.builtin
(nil) @constant.builtin
(blank) @constant.builtin
(empty) @constant.builtin

; ───────────────────────────────────────────────────────
; Variables
; ───────────────────────────────────────────────────────

(builtin_variable) @variable.special
(variable) @variable
(member_access) @variable.member
(property_accessor) @punctuation.delimiter

; Index access brackets
(index_access
  (index_access_begin) @punctuation.bracket
  (index_access_end) @punctuation.bracket)

; ───────────────────────────────────────────────────────
; Attributes — named parameters on tags
; ───────────────────────────────────────────────────────

(attribute_name) @attribute

; ───────────────────────────────────────────────────────
; Shortcode names
; ───────────────────────────────────────────────────────

(shortcode
  name: (shortcode_name) @function)
(shortcode_item
  name: (shortcode_item_name) @function)

; ───────────────────────────────────────────────────────
; Special quoted support — 'Now', 'Global', 'Lava'
; ───────────────────────────────────────────────────────

(quoted_support) @type.builtin

; ───────────────────────────────────────────────────────
; Frontmatter
; ───────────────────────────────────────────────────────

(frontmatter) @embedded

; ───────────────────────────────────────────────────────
; Embedded block content (for dim styling)
; ───────────────────────────────────────────────────────

(block_content) @embedded
(raw_content) @string
(comment_content) @comment
