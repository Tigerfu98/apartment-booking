import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Stateless HMAC-signed tokens for email-based booking approval/rejection.
 * No database storage needed — the token encodes bookingId + action + timestamp,
 * signed with ADMIN_SECRET. Tokens expire after 72 hours.
 */

const TOKEN_EXPIRY_MS = 72 * 60 * 60 * 1000; // 72 hours

function getSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error('ADMIN_SECRET environment variable is not set');
  return secret;
}

/**
 * Generates an HMAC-signed token for a booking action.
 * Token format: base64url( bookingId:action:timestamp:signature )
 */
export function generateApprovalToken(bookingId: string, action: 'approve' | 'reject'): string {
  const timestamp = Date.now().toString();
  const payload = `${bookingId}:${action}:${timestamp}`;
  const signature = createHmac('sha256', getSecret()).update(payload).digest('hex');
  const token = `${payload}:${signature}`;
  return Buffer.from(token).toString('base64url');
}

/**
 * Verifies and decodes an approval token.
 * Returns the decoded payload if valid and not expired, or null otherwise.
 */
export function verifyApprovalToken(token: string): {
  bookingId: string;
  action: 'approve' | 'reject';
  timestamp: number;
} | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return null;

    const [bookingId, action, timestampStr, providedSignature] = parts;

    // Validate action
    if (action !== 'approve' && action !== 'reject') return null;

    // Verify signature
    const payload = `${bookingId}:${action}:${timestampStr}`;
    const expectedSignature = createHmac('sha256', getSecret()).update(payload).digest('hex');

    const sigBuffer = Buffer.from(providedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    // Check expiration
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > TOKEN_EXPIRY_MS) {
      return null;
    }

    return { bookingId, action, timestamp };
  } catch {
    return null;
  }
}
