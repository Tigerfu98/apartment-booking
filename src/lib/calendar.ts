/**
 * .ics calendar invite generator for Casa STFU bookings.
 * Generates RFC 5545 compliant iCalendar files — no external dependencies needed.
 */

const LOCATION = '1550 Mission St, Apt 1903, San Francisco, CA 94103';
const ORGANIZER_NAME = 'Casa STFU';
const ORGANIZER_EMAIL = 'noreply@casastfu.com';

interface CalendarEventDetails {
  bookingId: string;
  guestName: string;
  guestEmail: string;
  numGuests: number;
  checkIn: string; // yyyy-MM-dd
  checkOut: string; // yyyy-MM-dd
  isCancellation?: boolean;
}

/**
 * Formats a date string (yyyy-MM-dd) as an iCal DATE value (YYYYMMDD).
 * We use all-day events since bookings are date-based, not time-based.
 */
function formatIcsDate(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

/**
 * Generates a UTC timestamp for DTSTAMP in the format YYYYMMDDTHHMMSSZ.
 */
function nowUtcTimestamp(): string {
  const now = new Date();
  return (
    now.getUTCFullYear().toString() +
    String(now.getUTCMonth() + 1).padStart(2, '0') +
    String(now.getUTCDate()).padStart(2, '0') +
    'T' +
    String(now.getUTCHours()).padStart(2, '0') +
    String(now.getUTCMinutes()).padStart(2, '0') +
    String(now.getUTCSeconds()).padStart(2, '0') +
    'Z'
  );
}

/**
 * Folds long lines per RFC 5545 (max 75 octets per line).
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  parts.push(line.slice(0, 75));
  let remaining = line.slice(75);
  while (remaining.length > 0) {
    parts.push(' ' + remaining.slice(0, 74));
    remaining = remaining.slice(74);
  }
  return parts.join('\r\n');
}

/**
 * Generates an .ics file content string for a booking event.
 * Uses METHOD:REQUEST for invites and METHOD:CANCEL for cancellations.
 * The UID is deterministic based on bookingId so cancellations match the original event.
 */
export function generateIcsInvite(event: CalendarEventDetails): string {
  const uid = `booking-${event.bookingId}@casastfu`;
  const dtstamp = nowUtcTimestamp();
  const method = event.isCancellation ? 'CANCEL' : 'REQUEST';
  const status = event.isCancellation ? 'CANCELLED' : 'CONFIRMED';
  const sequence = event.isCancellation ? 1 : 0;

  const summary = `Casa STFU: ${event.guestName}`;
  const description = event.isCancellation
    ? `CANCELLED — Stay by ${event.guestName} (${event.numGuests} guest${event.numGuests !== 1 ? 's' : ''})`
    : `Stay by ${event.guestName}\\n${event.numGuests} guest${event.numGuests !== 1 ? 's' : ''}\\nContact: ${event.guestEmail}`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Casa STFU//Booking System//EN',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    foldLine(`UID:${uid}`),
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${formatIcsDate(event.checkIn)}`,
    `DTEND;VALUE=DATE:${formatIcsDate(event.checkOut)}`,
    foldLine(`SUMMARY:${summary}`),
    foldLine(`DESCRIPTION:${description}`),
    foldLine(`LOCATION:${LOCATION}`),
    `STATUS:${status}`,
    `SEQUENCE:${sequence}`,
    foldLine(`ORGANIZER;CN=${ORGANIZER_NAME}:mailto:${ORGANIZER_EMAIL}`),
    foldLine(`ATTENDEE;CN=${event.guestName};RSVP=FALSE:mailto:${event.guestEmail}`),
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n') + '\r\n';
}

/**
 * Converts an .ics string to a base64-encoded string for email attachment.
 */
export function icsToBase64(icsContent: string): string {
  return Buffer.from(icsContent, 'utf-8').toString('base64');
}
