import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges conditional class names and resolves Tailwind conflicts, so a variant's classes
 * can be overridden by a caller's `className` without specificity guesswork.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
