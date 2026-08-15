import { differenceInCalendarDays, formatDistanceStrict, isAfter } from 'date-fns';

/**
 * Dates are stored UTC and formatted through a single fixed locale and timezone.
 *
 * The browser's local timezone is deliberately not used: a deadline is a property of the
 * institution, not of wherever the reader happens to be sitting, and letting the client
 * decide would make the same submission late for one viewer and on time for another.
 * Lateness and overdue arithmetic are always computed server-side.
 */
const LOCALE = 'en-GB';
const TIME_ZONE = 'UTC';

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: TIME_ZONE,
});

const shortDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: TIME_ZONE,
});

/** "11 February 2026" — prose and record cards. */
export function formatDate(value: Date | string): string {
  return dateFormatter.format(toDate(value));
}

/** "11 Feb 2026" — table cells, where width matters. */
export function formatDateShort(value: Date | string): string {
  return shortDateFormatter.format(toDate(value));
}

/** "11 Mar 2026, 17:00" — deadlines and submission timestamps. */
export function formatDateTime(value: Date | string): string {
  return dateTimeFormatter.format(toDate(value));
}

/**
 * Whole days a date is in the past, never negative. Registry work counts a debt in days
 * elapsed, so calendar days are the right unit — 23:59 to 00:01 is one day late, not
 * zero.
 */
export function daysOverdue(dueDate: Date | string, now: Date = new Date()): number {
  const days = differenceInCalendarDays(now, toDate(dueDate));
  return days > 0 ? days : 0;
}

/** "in 6 days" / "3 days ago" — the second line under an absolute date. */
export function relativeToNow(value: Date | string, now: Date = new Date()): string {
  const date = toDate(value);
  const distance = formatDistanceStrict(date, now);
  return isAfter(date, now) ? `in ${distance}` : `${distance} ago`;
}

/**
 * "2 days 4 hours" — the delay on a late submission.
 *
 * Shown rather than a bare "late" flag: two hours after the deadline and two weeks after
 * it are different conversations, and the staff queue should not make someone open a
 * record to tell them apart.
 */
export function formatDelay(fromValue: Date | string, toValue: Date | string): string {
  const milliseconds = toDate(toValue).getTime() - toDate(fromValue).getTime();
  if (milliseconds <= 0) return '';

  const totalMinutes = Math.floor(milliseconds / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${Math.max(1, minutes)}m`;
}

/** The same delay in words, for the student's own view. */
export function formatDelayLong(
  fromValue: Date | string,
  toValue: Date | string,
): string {
  const milliseconds = toDate(toValue).getTime() - toDate(fromValue).getTime();
  if (milliseconds <= 0) return '';

  const totalMinutes = Math.floor(milliseconds / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? '' : 's'}`);
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  if (parts.length === 0) {
    const shown = Math.max(1, minutes);
    parts.push(`${shown} minute${shown === 1 ? '' : 's'}`);
  }

  return parts.join(' ');
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}
