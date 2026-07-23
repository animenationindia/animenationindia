import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes description HTML strings from AniList/Jikan APIs.
 * Allows only basic formatting tags: <b>, <i>, <br>, <em>, <strong>.
 * Strips out scripts, iframes, event handlers, and malicious injections.
 * 
 * @param html Raw HTML string or plain text description
 * @returns Clean, safe HTML string (or empty string if null/undefined)
 */
export function sanitizeDescription(html: string | null | undefined): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Sanitize with strict allowed tags
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: [], // Strip all inline attributes like onclick, style, onerror
    KEEP_CONTENT: true,
  });

  return clean;
}

/**
 * Sanitizes HTML for safe rendering with dangerouslySetInnerHTML in detail pages.
 * Allows basic formatting, paragraphs, links, and lists while stripping scripts and dangerous attributes.
 */
export function sanitizeHTML(html: string | null | undefined): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'span', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'style', 'input', 'button'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover'],
  });
}
