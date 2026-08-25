/**
 * renderMarkdown — Pure JS Markdown parser + sanitizer with Minecraft-themed inline styles.
 * Replaces the React MarkdownContent component, react-markdown, and dompurify.
 *
 * Usage:
 *   import { renderMarkdown } from '/js/markdown.js';
 *   element.innerHTML = renderMarkdown('*hello* **world**');
 */

// ---------------------------------------------------------------------------
// 1. HTML Sanitizer
// ---------------------------------------------------------------------------

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li',
  'a', 'code', 'pre', 'span', 'h1', 'h2', 'h3', 'h4',
  'blockquote', 'hr',
]);

const ALLOWED_ATTRS = new Set(['href', 'target', 'rel', 'class']);

/**
 * Minimal HTML sanitizer — strips everything not on the allow-list.
 * Only runs when `sanitize` flag is true.
 */
function sanitizeHTML(html) {
  // We use a simple regex-based approach instead of DOMParser so this works
  // in any context (no document required).
  let result = '';
  let i = 0;
  const len = html.length;

  while (i < len) {
    if (html[i] === '<') {
      // Try to match a tag
      const closeAngle = html.indexOf('>', i);
      if (closeAngle === -1) {
        // Not a valid tag — escape the <
        result += '&lt;';
        i++;
        continue;
      }

      const tagContent = html.slice(i + 1, closeAngle);

      // Closing tag  </tagname>
      const closingMatch = tagContent.match(/^\/\s*([a-zA-Z][a-zA-Z0-9]*)\s*$/);
      if (closingMatch) {
        const tagName = closingMatch[1].toLowerCase();
        if (ALLOWED_TAGS.has(tagName)) {
          result += `</${tagName}>`;
        }
        i = closeAngle + 1;
        continue;
      }

      // Self-closing tag  <br/> or <br />
      const selfCloseMatch = tagContent.match(/^([a-zA-Z][a-zA-Z0-9]*)\s*\/?$/);
      if (selfCloseMatch) {
        const tagName = selfCloseMatch[1].toLowerCase();
        if (ALLOWED_TAGS.has(tagName)) {
          result += `<${tagContent}>`;
        }
        i = closeAngle + 1;
        continue;
      }

      // Opening tag with possible attributes  <tagname attr="val" ...>
      const openMatch = tagContent.match(/^([a-zA-Z][a-zA-Z0-9]*)([\s\S]*)$/);
      if (openMatch) {
        const tagName = openMatch[1].toLowerCase();
        if (ALLOWED_TAGS.has(tagName)) {
          const attrString = openMatch[2];
          const safeAttrs = parseAndFilterAttrs(attrString);
          result += `<${tagName}${safeAttrs}>`;
        }
        i = closeAngle + 1;
        continue;
      }

      // Unrecognised — escape
      result += '&lt;';
      i++;
    } else {
      // Plain text — copy until next <
      const nextOpen = html.indexOf('<', i);
      if (nextOpen === -1) {
        result += html.slice(i);
        break;
      }
      result += html.slice(i, nextOpen);
      i = nextOpen;
    }
  }

  return result;
}

/**
 * Parse an attribute string and keep only allowed attributes.
 */
function parseAndFilterAttrs(attrString) {
  let result = '';
  // Match name="value"  name='value'  name=value
  const attrRe = /\s+([a-zA-Z][a-zA-Z0-9\-_]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  let m;
  while ((m = attrRe.exec(attrString)) !== null) {
    const name = m[1].toLowerCase();
    if (!ALLOWED_ATTRS.has(name)) continue;
    const value = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : '';
    // For href, make sure it starts with http/https/mailto/#/ or is relative
    if (name === 'href' && value && !/^\s*(https?:\/\/|mailto:|\/|#|\.\.?\/)/.test(value)) {
      continue; // skip potentially dangerous hrefs
    }
    result += ` ${name}="${escapeAttr(value)}"`;
  }
  return result;
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------------------------------------------------------------------------
// 2. Inline formatting parser
// ---------------------------------------------------------------------------

/**
 * Parse inline markdown within a line and return HTML with styles applied.
 * Handles: **bold**, *italic*, `code`, [link](url)
 */
function parseInline(text) {
  let result = '';
  let i = 0;
  const len = text.length;

  while (i < len) {
    // --- inline code `...` (must be checked before bold/italic) ---
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end !== -1) {
        const code = escapeHTML(text.slice(i + 1, end));
        result += `<code style="background:#222;border:1px solid #555;padding:1px 4px;font-family:monospace;font-size:0.75rem;color:var(--mc-emerald-green)">${code}</code>`;
        i = end + 1;
        continue;
      }
    }

    // --- bold+italic ***text*** or ___text___ ---
    if (
      (text[i] === '*' && text[i + 1] === '*' && text[i + 2] === '*') ||
      (text[i] === '_' && text[i + 1] === '_' && text[i + 2] === '_')
    ) {
      const marker = text.slice(i, i + 3);
      const end = text.indexOf(marker, i + 3);
      if (end !== -1) {
        const inner = escapeHTML(text.slice(i + 3, end));
        result += `<strong style="color:var(--mc-gold);text-shadow:1px 1px 0 #000"><em style="color:var(--mc-diamond-blue)">${inner}</em></strong>`;
        i = end + 3;
        continue;
      }
    }

    // --- bold **text** or __text__ ---
    if (
      (text[i] === '*' && text[i + 1] === '*') ||
      (text[i] === '_' && text[i + 1] === '_')
    ) {
      const marker = text.slice(i, i + 2);
      const end = text.indexOf(marker, i + 2);
      if (end !== -1) {
        const inner = text.slice(i + 2, end);
        result += `<strong style="color:var(--mc-gold);text-shadow:1px 1px 0 #000">${parseInline(inner)}</strong>`;
        i = end + 2;
        continue;
      }
    }

    // --- italic *text* (not ** which was already tried) ---
    if (text[i] === '*' && text[i + 1] !== '*') {
      const end = text.indexOf('*', i + 1);
      if (end !== -1 && (end + 1 >= len || /\s/.test(text[end + 1]) || text[end + 1] === '<' || text[end + 1] === undefined)) {
        const inner = text.slice(i + 1, end);
        // Make sure it's not empty and opening isn't preceded by whitespace in a way that's odd
        if (inner.length > 0) {
          result += `<em style="color:var(--mc-diamond-blue)">${parseInline(inner)}</em>`;
          i = end + 1;
          continue;
        }
      }
    }

    // --- italic _text_ (single underscore, not __) ---
    if (text[i] === '_' && text[i + 1] !== '_') {
      const end = text.indexOf('_', i + 1);
      if (end !== -1) {
        const inner = text.slice(i + 1, end);
        if (inner.length > 0) {
          result += `<em style="color:var(--mc-diamond-blue)">${parseInline(inner)}</em>`;
          i = end + 1;
          continue;
        }
      }
    }

    // --- link [text](url) ---
    if (text[i] === '[') {
      const closeBracket = text.indexOf(']', i + 1);
      if (closeBracket !== -1 && text[closeBracket + 1] === '(') {
        const closeParen = text.indexOf(')', closeBracket + 2);
        if (closeParen !== -1) {
          const linkText = escapeHTML(text.slice(i + 1, closeBracket));
          const url = text.slice(closeBracket + 2, closeParen).trim();
          // Basic URL sanity check
          if (url.length > 0) {
            result += `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer" style="color:var(--mc-diamond-blue);text-decoration:underline">${linkText}</a>`;
            i = closeParen + 1;
            continue;
          }
        }
      }
    }

    // --- image ![alt](url) — render as link for safety ---
    if (text[i] === '!' && text[i + 1] === '[') {
      const closeBracket = text.indexOf(']', i + 2);
      if (closeBracket !== -1 && text[closeBracket + 1] === '(') {
        const closeParen = text.indexOf(')', closeBracket + 2);
        if (closeParen !== -1) {
          const altText = escapeHTML(text.slice(i + 2, closeBracket));
          const url = text.slice(closeBracket + 2, closeParen).trim();
          if (url.length > 0) {
            result += `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer" style="color:var(--mc-diamond-blue);text-decoration:underline">[${altText}]</a>`;
            i = closeParen + 1;
            continue;
          }
        }
      }
    }

    // --- plain character ---
    if (text[i] === '&') {
      result += '&amp;';
    } else if (text[i] === '<') {
      result += '&lt;';
    } else if (text[i] === '>') {
      result += '&gt;';
    } else {
      result += text[i];
    }
    i++;
  }

  return result;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// 3. Block-level parser
// ---------------------------------------------------------------------------

/**
 * Parse full markdown (block + inline) and return styled HTML.
 */
function parseMarkdown(content) {
  // Normalise line endings
  const raw = content.replace(/\r\n?/g, '\n');
  const lines = raw.split('\n');
  let html = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // --- fenced code block ``` ---
    if (line.trimStart().startsWith('```')) {
      const lang = line.trimStart().slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing fence
      const codeContent = escapeHTML(codeLines.join('\n'));
      html += `<pre style="background:#111;border:2px solid #555;padding:8px;margin:8px 0;overflow-x:auto;font-family:monospace;font-size:0.75rem;color:var(--mc-emerald-green)"><code>${codeContent}</code></pre>`;
      continue;
    }

    // --- headings ---
    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      html += buildHeading(level, text);
      i++;
      continue;
    }

    // --- horizontal rule ---
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      html += `<hr style="border:none;border-top:2px solid var(--mc-stone-gray);margin:12px 0">`;
      i++;
      continue;
    }

    // --- blockquote ---
    if (line.trimStart().startsWith('>')) {
      const bqLines = [];
      while (i < lines.length && (lines[i].trimStart().startsWith('>') || (lines[i].trim() === '' && i + 1 < lines.length && lines[i + 1].trimStart().startsWith('>')))) {
        let bqLine = lines[i].trimStart();
        if (bqLine.startsWith('> ')) {
          bqLine = bqLine.slice(2);
        } else if (bqLine.startsWith('>')) {
          bqLine = bqLine.slice(1);
        }
        bqLines.push(bqLine);
        i++;
      }
      const innerContent = parseMarkdown(bqLines.join('\n'));
      html += `<blockquote style="border-left:4px solid var(--mc-emerald-green);padding-left:12px;margin:8px 0;color:var(--mc-light-gray);font-style:italic">${innerContent}</blockquote>`;
      continue;
    }

    // --- unordered list ---
    if (/^\s*[-*+]\s/.test(line)) {
      const items = [];
      let current = null;
      while (i < lines.length) {
        const listLine = lines[i];
        // Nested item (indented)
        const nestedMatch = listLine.match(/^(\s{2,})[-*+]\s(.*)$/);
        if (nestedMatch && current) {
          current += '\n' + nestedMatch[2];
          i++;
          continue;
        }
        const itemMatch = listLine.match(/^\s*[-*+]\s(.*)$/);
        if (itemMatch) {
          if (current !== null) items.push(current);
          current = itemMatch[1];
          i++;
        } else if (listLine.trim() === '') {
          // Check if next line continues the list
          if (i + 1 < lines.length && /^\s*[-*+]/.test(lines[i + 1])) {
            i++;
            continue;
          }
          break;
        } else {
          break;
        }
      }
      if (current !== null) items.push(current);
      html += `<ul style="margin:8px 0;padding-left:20px;list-style-type:square">`;
      for (const item of items) {
        html += `<li style="margin:2px 0">${parseInline(item)}</li>`;
      }
      html += `</ul>`;
      continue;
    }

    // --- ordered list ---
    if (/^\s*\d+\.\s/.test(line)) {
      const items = [];
      let current = null;
      while (i < lines.length) {
        const listLine = lines[i];
        const nestedMatch = listLine.match(/^(\s{2,})\d+\.\s(.*)$/);
        if (nestedMatch && current) {
          current += '\n' + nestedMatch[2];
          i++;
          continue;
        }
        const itemMatch = listLine.match(/^\s*\d+\.\s(.*)$/);
        if (itemMatch) {
          if (current !== null) items.push(current);
          current = itemMatch[1];
          i++;
        } else if (listLine.trim() === '') {
          if (i + 1 < lines.length && /^\s*\d+\./.test(lines[i + 1])) {
            i++;
            continue;
          }
          break;
        } else {
          break;
        }
      }
      if (current !== null) items.push(current);
      html += `<ol style="margin:8px 0;padding-left:20px;list-style-type:decimal">`;
      for (const item of items) {
        html += `<li style="margin:2px 0">${parseInline(item)}</li>`;
      }
      html += `</ol>`;
      continue;
    }

    // --- empty line ---
    if (line.trim() === '') {
      i++;
      continue;
    }

    // --- paragraph (one or more non-empty, non-special lines) ---
    const paraLines = [];
    while (i < lines.length) {
      const pLine = lines[i];
      if (pLine.trim() === '') break;
      // Stop if we hit a block-level element
      if (
        pLine.trimStart().startsWith('```') ||
        /^#{1,4}\s/.test(pLine) ||
        /^(-{3,}|\*{3,}|_{3,})\s*$/.test(pLine.trim()) ||
        pLine.trimStart().startsWith('>') ||
        /^\s*[-*+]\s/.test(pLine) ||
        /^\s*\d+\.\s/.test(pLine)
      ) {
        break;
      }
      paraLines.push(pLine);
      i++;
    }
    if (paraLines.length > 0) {
      const paraContent = parseInline(paraLines.join('<br>'));
      html += `<p style="margin:0 0 8px 0">${paraContent}</p>`;
    }
  }

  return html;
}

// ---------------------------------------------------------------------------
// 4. Heading builder
// ---------------------------------------------------------------------------

function buildHeading(level, text) {
  const inlineContent = parseInline(text);
  const base = 'font-family:var(--mc-font);margin:';
  switch (level) {
    case 1:
      return `<h1 style="${base}12px 0 8px;font-size:var(--mc-font-size-xl);color:var(--mc-gold);text-shadow:2px 2px 0 #000">${inlineContent}</h1>`;
    case 2:
      return `<h2 style="${base}10px 0 6px;font-size:var(--mc-font-size-lg);color:var(--mc-gold);text-shadow:2px 2px 0 #000">${inlineContent}</h2>`;
    case 3:
      return `<h3 style="${base}8px 0 4px;font-size:var(--mc-font-size-md);color:var(--mc-diamond-blue);text-shadow:1px 1px 0 #000">${inlineContent}</h3>`;
    case 4:
      return `<h4 style="${base}8px 0 4px;font-size:var(--mc-font-size-sm);color:var(--mc-diamond-blue);text-shadow:1px 1px 0 #000">${inlineContent}</h4>`;
    default:
      return `<p style="margin:0 0 8px 0">${inlineContent}</p>`;
  }
}

// ---------------------------------------------------------------------------
// 5. Public API
// ---------------------------------------------------------------------------

/**
 * Render markdown content to HTML string.
 *
 * @param {string} content  - Raw markdown string.
 * @param {boolean} sanitize - Whether to sanitize the output HTML (default true).
 * @returns {string} HTML string ready to assign to innerHTML.
 */
export function renderMarkdown(content, sanitize = true) {
  if (typeof content !== 'string') return '';
  let html = parseMarkdown(content);
  if (sanitize) {
    html = sanitizeHTML(html);
  }
  return html;
}

export default renderMarkdown;
