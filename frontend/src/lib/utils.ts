import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeRange(start?: string | null, end?: string | null): string {
  if (!start) return "Unscheduled";
  const s = new Date(start);
  const startStr = s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  if (!end) return startStr;
  const e = new Date(end);
  const endStr = e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${startStr} – ${endStr}`;
}

