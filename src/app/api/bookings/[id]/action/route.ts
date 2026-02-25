import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyApprovalToken } from '@/lib/email-token';
import { sendGuestApprovedEmail, sendGuestRejectedEmail, sendHostCalendarInvite } from '@/lib/email';

/**
 * GET /api/bookings/[id]/action?token=XXX
 *
 * Handles email-based approve/reject. The token encodes the action (approve/reject),
 * is HMAC-signed, and expires after 72 hours. Returns an HTML page with the result
 * so the admin sees feedback in their browser after clicking the email link.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  // Helper to return a styled HTML response page
  function htmlResponse(title: string, message: string, success: boolean) {
    const color = success ? '#16a34a' : '#dc2626';
    const icon = success ? '&#10003;' : '&#10007;';
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Casa STFU</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF9F7;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:80px 24px;text-align:center;">
    <div style="background:#ffffff;border-radius:16px;border:1px solid #E8E4DF;padding:40px 32px;">
      <div style="width:56px;height:56px;margin:0 auto 20px;border-radius:50%;background:${color}10;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:28px;color:${color};">${icon}</span>
      </div>
      <h1 style="margin:0 0 12px;color:#3E372F;font-size:22px;font-weight:600;">${title}</h1>
      <p style="color:#7D7166;font-size:15px;line-height:1.6;margin:0;">${message}</p>
    </div>
    <p style="text-align:center;color:#B8AFA3;font-size:12px;margin-top:24px;">
      Casa STFU &middot; San Francisco
    </p>
  </div>
</body>
</html>`;
    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Validate token
  if (!token) {
    return htmlResponse('Invalid Link', 'This link is missing a required token.', false);
  }

  const payload = verifyApprovalToken(token);
  if (!payload) {
    return htmlResponse('Link Expired', 'This approval link has expired or is invalid. Please use the admin dashboard instead.', false);
  }

  // Verify the token's bookingId matches the URL
  if (payload.bookingId !== id) {
    return htmlResponse('Invalid Link', 'This link does not match the expected booking.', false);
  }

  const db = getDb();

  // Fetch booking
  const [existing] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id));

  if (!existing) {
    return htmlResponse('Not Found', 'This booking no longer exists.', false);
  }

  // Check if already actioned
  if (existing.status !== 'pending') {
    return htmlResponse(
      'Already Handled',
      `This booking has already been ${existing.status}. No further action needed.`,
      existing.status === 'approved'
    );
  }

  // Apply the action
  const newStatus = payload.action === 'approve' ? 'approved' : 'rejected';

  const [updated] = await db
    .update(bookings)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, id))
    .returning();

  // Send emails (non-blocking)
  const emailDetails = {
    bookingId: updated.id,
    guestName: updated.guestName,
    guestEmail: updated.guestEmail,
    numGuests: updated.numGuests,
    checkIn: updated.checkIn,
    checkOut: updated.checkOut,
    adminMessage: updated.adminMessage,
  };

  if (newStatus === 'approved') {
    sendGuestApprovedEmail(emailDetails).catch((err) => console.error('Guest approved email failed:', err));
    sendHostCalendarInvite(emailDetails, false).catch((err) => console.error('Host calendar invite failed:', err));
  } else {
    sendGuestRejectedEmail(emailDetails).catch((err) => console.error('Guest rejected email failed:', err));
  }

  // Return success page
  if (newStatus === 'approved') {
    return htmlResponse(
      'Booking Approved',
      `${updated.guestName}&rsquo;s stay (${updated.checkIn} &rarr; ${updated.checkOut}) has been approved. A confirmation email and calendar invite have been sent.`,
      true
    );
  } else {
    return htmlResponse(
      'Booking Rejected',
      `${updated.guestName}&rsquo;s request (${updated.checkIn} &rarr; ${updated.checkOut}) has been rejected. A notification email has been sent.`,
      false
    );
  }
}
