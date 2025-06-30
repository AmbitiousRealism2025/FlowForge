import { Gig, PracticeTask, RehearsalTask, RehearsalEvent } from '@/types';

/**
 * Generic search function that searches through multiple fields of an object
 */
export function searchItems<T extends Record<string, any>>(
  items: T[],
  query: string,
  searchFields: (keyof T)[]
): T[] {
  if (!query.trim()) {
    return items;
  }

  const normalizedQuery = query.toLowerCase().trim();
  
  return items.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      if (value == null) return false;
      
      // Handle different types of values
      if (typeof value === 'string') {
        return value.toLowerCase().includes(normalizedQuery);
      }
      
      if (typeof value === 'number') {
        return value.toString().includes(normalizedQuery);
      }
      
      if (typeof value === 'boolean') {
        return value.toString().includes(normalizedQuery);
      }
      
      if (value instanceof Date) {
        return value.toLocaleDateString().toLowerCase().includes(normalizedQuery);
      }
      
      return false;
    });
  });
}

/**
 * Search gigs by title, venue, address, contact, and compensation
 */
export function searchGigs(gigs: Gig[], query: string): Gig[] {
  return searchItems(gigs, query, [
    'title',
    'venueName', 
    'address',
    'contact',
    'compensation',
    'notes'
  ]);
}

/**
 * Search practice tasks by title, note, and category
 */
export function searchPracticeTasks(tasks: PracticeTask[], query: string): PracticeTask[] {
  return searchItems(tasks, query, [
    'title',
    'note',
    'category'
  ]);
}

/**
 * Search rehearsal tasks by title and note
 */
export function searchRehearsalTasks(tasks: RehearsalTask[], query: string): RehearsalTask[] {
  return searchItems(tasks, query, [
    'title',
    'note'
  ]);
}

/**
 * Search rehearsal events by name and location
 */
export function searchRehearsalEvents(events: RehearsalEvent[], query: string): RehearsalEvent[] {
  return searchItems(events, query, [
    'name',
    'location'
  ]);
}

/**
 * Highlight matching text in search results
 */
export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm.trim()) {
    return text;
  }

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '**$1**'); // Using markdown-style highlighting
}

/**
 * Get search suggestions based on existing data
 */
export function getSearchSuggestions<T extends Record<string, any>>(
  items: T[],
  field: keyof T,
  limit = 5
): string[] {
  const suggestions = new Set<string>();
  
  items.forEach(item => {
    const value = item[field];
    if (typeof value === 'string' && value.trim()) {
      // Split by common delimiters and add individual words
      const words = value.split(/[\s,.-]+/).filter(word => word.length > 2);
      words.forEach(word => suggestions.add(word.toLowerCase()));
    }
  });
  
  return Array.from(suggestions).slice(0, limit);
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}