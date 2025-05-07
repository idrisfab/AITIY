import { format, parseISO } from 'date-fns';

/**
 * Format a date string or Date object to a human-readable format
 * @param date Date string or Date object
 * @param formatString Format string to use
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatString: string = 'MMM d, yyyy'
): string {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Get a date range for analytics (last 7 days, last 30 days, etc.)
 * @param days Number of days to go back
 * @returns Object with startDate and endDate
 */
export function getDateRange(days: number = 30): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return { startDate, endDate };
}

/**
 * Group analytics data by date
 * @param data Array of analytics data
 * @returns Object with dates as keys and arrays of data as values
 */
export function groupByDate<T extends { date: string }>(data: T[]): Record<string, T[]> {
  return data.reduce((acc, item) => {
    const date = item.date.split('T')[0]; // Extract date part only
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}
