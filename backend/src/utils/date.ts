import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns';

export function parseDateSafe(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const parsed = parseISO(dateStr);
  return isValid(parsed) ? parsed : null;
}

export function getDayBounds(date: Date) {
  return {
    start: startOfDay(date),
    end: endOfDay(date)
  };
}

export function getWeekBounds(date: Date, weekStartsOn: 0 | 1 = 1) {
  return {
    start: startOfWeek(date, { weekStartsOn }),
    end: endOfWeek(date, { weekStartsOn })
  };
}

export function getMonthBounds(date: Date) {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date)
  };
}

