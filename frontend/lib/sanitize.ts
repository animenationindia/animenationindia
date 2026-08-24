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

/**
 * Intelligently cleans and beautifies anime synopsis strings:
 * - Strips raw HTML tags and decodes entities
 * - Removes metadata tags like [Written by MAL Rewrite] or (Source: ...) from main text
 * - Normalizes paragraph spacing for beautiful typography
 */
export function cleanAnimeSynopsis(rawText: string | null | undefined): { text: string; sourceAttribution?: string } {
  if (!rawText || typeof rawText !== 'string') {
    return { text: 'No synopsis available for this title.' };
  }

  let text = rawText
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>?/gm, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();

  let sourceAttribution: string | undefined;

  // Extract [Written by MAL Rewrite] or (Source: ...)
  const malRewriteMatch = text.match(/\[Written by MAL Rewrite\]/i);
  const sourceMatch = text.match(/\(Source:\s*([^\)]+)\)/i) || text.match(/\[Source:\s*([^\]]+)\]/i);

  if (malRewriteMatch) {
    sourceAttribution = 'Written by MyAnimeList';
    text = text.replace(/\[Written by MAL Rewrite\]/gi, '').trim();
  } else if (sourceMatch) {
    sourceAttribution = `Source: ${sourceMatch[1].trim()}`;
    text = text.replace(sourceMatch[0], '').trim();
  }

  // Clean double newlines
  text = text.replace(/\n{3,}/g, '\n\n');

  return {
    text: text || 'No synopsis available for this title.',
    sourceAttribution
  };
}
