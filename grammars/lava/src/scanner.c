/**
 * External scanner for tree-sitter-lava.
 *
 * Handles tokenization of raw text content that cannot be expressed
 * with regular expressions in the grammar:
 *
 *   - _content:         Text between Lava constructs (HTML, etc.)
 *   - _block_content:   Text inside embedded blocks ({% javascript %}...{% endjavascript %})
 *   - _raw_content:     Text inside {% raw %}...{% endraw %}
 *   - _comment_content: Text inside {% comment %}...{% endcomment %}
 *   - error_sentinel:   Unused sentinel for error recovery
 */

#include "tree_sitter/parser.h"
#include "tree_sitter/alloc.h"

#include <string.h>
#include <stdbool.h>

enum TokenType {
  CONTENT,
  BLOCK_CONTENT,
  RAW_CONTENT,
  COMMENT_CONTENT,
  ERROR_SENTINEL,
};

// ─── Helper: peek ahead without advancing ─────────────────────

static bool check_ahead(TSLexer *lexer, const char *str) {
  // This only checks the current lookahead character against str[0]
  // For multi-char lookahead we advance and mark_end
  return lexer->lookahead == (int32_t)str[0];
}

// ─── Helper: check if we're at a specific string ──────────────

static bool at_string(TSLexer *lexer, const char *str, int len) {
  for (int i = 0; i < len; i++) {
    if (lexer->eof(lexer)) return false;
    if (lexer->lookahead != (int32_t)str[i]) return false;
    if (i < len - 1) lexer->advance(lexer, false);
  }
  return true;
}

// ─── Helper: check if at tag open ({% or {%-) ─────────────────

static bool at_tag_open(TSLexer *lexer) {
  return lexer->lookahead == '{' ;
}

// ─── Helper: scan until a Lava delimiter is found ─────────────
// Returns true if any content was consumed.

static bool scan_content(TSLexer *lexer) {
  bool has_content = false;

  while (!lexer->eof(lexer)) {
    // Check for Lava delimiters: {{, {%, {[, [[, //-, /-
    if (lexer->lookahead == '{') {
      lexer->mark_end(lexer);
      lexer->advance(lexer, false);

      if (lexer->lookahead == '{' ||  // {{
          lexer->lookahead == '%' ||  // {%
          lexer->lookahead == '[') {  // {[
        return has_content;
      }
      // Not a delimiter, continue
      has_content = true;
      continue;
    }

    if (lexer->lookahead == '[') {
      lexer->mark_end(lexer);
      lexer->advance(lexer, false);

      if (lexer->lookahead == '[') {  // [[
        return has_content;
      }
      has_content = true;
      continue;
    }

    if (lexer->lookahead == '/') {
      lexer->mark_end(lexer);
      lexer->advance(lexer, false);

      if (lexer->lookahead == '/') {
        // Check for //-
        lexer->advance(lexer, false);
        if (lexer->lookahead == '-') {
          return has_content;  // //- line comment
        }
        has_content = true;
        continue;
      }
      if (lexer->lookahead == '-') {
        return has_content;  // /- block comment
      }
      has_content = true;
      continue;
    }

    lexer->advance(lexer, false);
    has_content = true;
  }

  lexer->mark_end(lexer);
  return has_content;
}

// ─── Helper: scan until a specific closing tag is found ───────
// Scans for {% endXXX %} where XXX is the tag name.

static bool scan_until_end_tag(TSLexer *lexer, const char *end_tag_name) {
  bool has_content = false;
  int end_tag_len = (int)strlen(end_tag_name);

  while (!lexer->eof(lexer)) {
    if (lexer->lookahead == '{') {
      lexer->mark_end(lexer);
      lexer->advance(lexer, false);

      if (lexer->lookahead == '%') {
        lexer->advance(lexer, false);

        // Skip optional whitespace-trim dash
        if (lexer->lookahead == '-') {
          lexer->advance(lexer, false);
        }

        // Skip whitespace
        while (lexer->lookahead == ' ' || lexer->lookahead == '\t' ||
               lexer->lookahead == '\n' || lexer->lookahead == '\r') {
          lexer->advance(lexer, false);
        }

        // Check for the end tag name
        bool match = true;
        for (int i = 0; i < end_tag_len; i++) {
          if (lexer->eof(lexer) || lexer->lookahead != (int32_t)end_tag_name[i]) {
            match = false;
            break;
          }
          lexer->advance(lexer, false);
        }

        if (match) {
          // Check that the end tag name is followed by whitespace or %}
          if (lexer->lookahead == ' ' || lexer->lookahead == '\t' ||
              lexer->lookahead == '\n' || lexer->lookahead == '\r' ||
              lexer->lookahead == '%' || lexer->lookahead == '-') {
            // Found the closing tag — return content before it
            return has_content;
          }
        }

        // Not the right end tag, continue scanning
        has_content = true;
        continue;
      }

      // Not {%, continue
      has_content = true;
      continue;
    }

    lexer->advance(lexer, false);
    has_content = true;
  }

  lexer->mark_end(lexer);
  return has_content;
}

// ─── Scanner Interface ───────────────────────────────────────

void *tree_sitter_lava_external_scanner_create(void) {
  return NULL;
}

void tree_sitter_lava_external_scanner_destroy(void *payload) {
  // No state to free
}

unsigned tree_sitter_lava_external_scanner_serialize(void *payload, char *buffer) {
  return 0;  // No state
}

void tree_sitter_lava_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
  // No state
}

bool tree_sitter_lava_external_scanner_scan(
  void *payload,
  TSLexer *lexer,
  const bool *valid_symbols
) {
  // Error recovery guard
  if (valid_symbols[ERROR_SENTINEL]) {
    return false;
  }

  // Raw content: scan until {% endraw %}
  if (valid_symbols[RAW_CONTENT]) {
    if (scan_until_end_tag(lexer, "endraw")) {
      lexer->result_symbol = RAW_CONTENT;
      return true;
    }
    // Empty raw block — still valid
    lexer->result_symbol = RAW_CONTENT;
    return false;
  }

  // Comment content: scan until {% endcomment %}
  if (valid_symbols[COMMENT_CONTENT]) {
    if (scan_until_end_tag(lexer, "endcomment")) {
      lexer->result_symbol = COMMENT_CONTENT;
      return true;
    }
    lexer->result_symbol = COMMENT_CONTENT;
    return false;
  }

  // Block content: scan until {% end<tag> %}
  // The grammar uses this for javascript, stylesheet, sql, execute blocks.
  // We scan until any {%...end* tag since the grammar knows which one to expect.
  if (valid_symbols[BLOCK_CONTENT]) {
    bool has_content = false;

    while (!lexer->eof(lexer)) {
      if (lexer->lookahead == '{') {
        lexer->mark_end(lexer);
        lexer->advance(lexer, false);

        if (lexer->lookahead == '%') {
          lexer->advance(lexer, false);

          // Skip optional dash
          if (lexer->lookahead == '-') {
            lexer->advance(lexer, false);
          }

          // Skip whitespace
          while (lexer->lookahead == ' ' || lexer->lookahead == '\t' ||
                 lexer->lookahead == '\n' || lexer->lookahead == '\r') {
            lexer->advance(lexer, false);
          }

          // Check for "end" prefix
          if (lexer->lookahead == 'e') {
            lexer->advance(lexer, false);
            if (lexer->lookahead == 'n') {
              lexer->advance(lexer, false);
              if (lexer->lookahead == 'd') {
                // Found {%...end — this is likely the closing tag
                if (has_content) {
                  lexer->result_symbol = BLOCK_CONTENT;
                  return true;
                }
                return false;
              }
            }
          }

          has_content = true;
          continue;
        }

        has_content = true;
        continue;
      }

      // Also check for Lava objects {{ }} inside embedded blocks
      // (Lava objects can appear inside JS/CSS/SQL blocks)
      lexer->advance(lexer, false);
      has_content = true;
    }

    if (has_content) {
      lexer->mark_end(lexer);
      lexer->result_symbol = BLOCK_CONTENT;
      return true;
    }
    return false;
  }

  // General content: scan until any Lava delimiter
  if (valid_symbols[CONTENT]) {
    if (scan_content(lexer)) {
      lexer->result_symbol = CONTENT;
      return true;
    }
    return false;
  }

  return false;
}
