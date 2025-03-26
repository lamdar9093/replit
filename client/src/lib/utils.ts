import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatTime(time: string) {
  // Formats time from "HH:MM:SS" to "HH:MM"
  return time.substring(0, 5);
}

export function getInitials(name: string) {
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function getDepartmentColor(department: string) {
  switch (department.toLowerCase()) {
    case 'service':
      return "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300";
    case 'cuisine':
      return "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-800 text-green-800 dark:text-green-300";
    case 'réception':
      return "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300";
    case 'administration':
      return "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300";
    default:
      return "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300";
  }
}

export function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'approved':
      return "success";
    case 'denied':
      return "destructive";
    case 'pending':
      return "warning";
    default:
      return "default";
  }
}
