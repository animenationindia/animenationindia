import sanitizeHtml from 'sanitize-html';

/**
 * Sanitizes description HTML strings from AniList/Jikan APIs.
 * Allows only basic formatting tags: <b>, <i>, <br>, <em>, <strong>, <p>.
 * Strips out scripts, iframes, event handlers, and malicious injections.
 * Pure JavaScript sanitizer without jsdom dependency (Serverless CJS/ESM safe).
 * 
 * @param html Raw HTML string or plain text description
 * @returns Clean, safe HTML string (or empty string if null/undefined)
 */
export function sanitizeDescription(html: string | null | undefined): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return sanitizeHtml(html, {
    allowedTags: ['b', 'i', 'em', 'strong', 'br', 'p'],
    allowedAttributes: {}, // Strip all inline attributes like onclick, style, onerror
    disallowedTagsMode: 'discard',
  });
}

/**
 * Sanitizes HTML for safe rendering with dangerouslySetInnerHTML in detail pages.
 * Allows basic formatting, paragraphs, safe links, and lists while stripping scripts and dangerous attributes.
 */
export function sanitizeHTML(html: string | null | undefined): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return sanitizeHtml(html, {
    allowedTags: ['b', 'i', 'em', 'strong', 'br', 'p', 'span', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      span: ['class'],
    },
    allowedSchemes: ['http', 'https'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' })
    },
    disallowedTagsMode: 'discard',
  });
}
