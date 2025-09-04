/**
 * Count words in text content
 */
export const countWords = (text: string): number => {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  
  // Remove HTML tags and normalize whitespace
  const cleanText = text
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
    
  if (!cleanText) {
    return 0;
  }
  
  // Split by whitespace and filter out empty strings
  return cleanText.split(/\s+/).filter(word => word.length > 0).length;
};

/**
 * Calculate reading time in minutes based on word count
 * Average reading speed: 200-250 words per minute
 */
export const calculateReadingTime = (text: string): number => {
  const wordCount = countWords(text);
  const wordsPerMinute = 225; // Average reading speed
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  
  return Math.max(1, readingTime); // Minimum 1 minute
};

/**
 * Generate excerpt from text content
 */
export const generateExcerpt = (text: string, maxLength: number = 200): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Remove HTML tags
  const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (cleanText.length <= maxLength) {
    return cleanText;
  }
  
  // Cut at word boundary
  const excerpt = cleanText.substring(0, maxLength);
  const lastSpaceIndex = excerpt.lastIndexOf(' ');
  
  if (lastSpaceIndex > maxLength * 0.8) {
    return excerpt.substring(0, lastSpaceIndex) + '...';
  }
  
  return excerpt + '...';
};

/**
 * Sanitize HTML content for safe storage/display
 */
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
    .replace(/<style[^>]*>.*?<\/style>/gis, '')   // Remove style tags
    .replace(/on\w+="[^"]*"/gi, '')               // Remove event handlers
    .replace(/javascript:/gi, '')                 // Remove javascript: protocol
    .trim();
};

/**
 * Extract keywords from text content
 */
export const extractKeywords = (text: string, count: number = 10): string[] => {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  // Remove HTML and normalize
  const cleanText = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^\w\sáéíóúüñç]/gi, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  
  // Common Spanish stop words
  const stopWords = new Set([
    'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se',
    'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para',
    'del', 'al', 'los', 'las', 'una', 'sus', 'del', 'al', 'como',
    'pero', 'si', 'ya', 'muy', 'más', 'ser', 'está', 'han', 'tiene',
    'este', 'esta', 'estos', 'estas', 'uno', 'sobre', 'todo', 'también',
    'fue', 'puede', 'otros', 'tras', 'sin', 'cada', 'según', 'hacer',
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has'
  ]);
  
  // Extract words and count frequency
  const words = cleanText.split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  const frequency: { [key: string]: number } = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  // Sort by frequency and return top keywords
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);
};