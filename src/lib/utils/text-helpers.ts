/**
 * Strips HTML tags from a string and optionally truncates it
 * @param html - The HTML string to strip
 * @param maxLength - Maximum length of the returned string (default: 100)
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Plain text string without HTML tags
 */
export const stripHtml = (html: string, maxLength: number = 100, suffix: string = '...'): string => {
  if (!html) return '';
  
  const plainText = html.replace(/<[^>]*>/g, '');
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  return plainText.substring(0, maxLength) + suffix;
};

/**
 * Strips HTML tags without truncation
 * @param html - The HTML string to strip
 * @returns Plain text string without HTML tags
 */
export const stripHtmlOnly = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};
