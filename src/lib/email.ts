import { Resend } from 'resend';
import { generateIcsInvite, icsToBase64 } from './calendar';
import { generateApprovalToken } from './email-token';

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend sandbox (onboarding@resend.dev) can ONLY send to the account owner's email.
// To send to guests, add & verify your own domain in Resend and update FROM_EMAIL.
const FROM_EMAIL = 'Casa STFU <onboarding@resend.dev>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const HOST_EMAILS = ['tigerfu98@gmail.com', 'sarah.chxn@gmail.com'];

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#FAF9F7;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="background:#ffffff;border-radius:16px;border:1px solid #E8E4DF;padding:32px;">
      ${content}
    </div>
    <p style="text-align:center;color:#B8AFA3;font-size:12px;margin-top:24px;">
      Casa STFU &middot; San Francisco
    </p>
  </div>
</body>
</html>`;
}

export interface BookingDetails {
  bookingId: string;
  guestName: string;
  guestEmail: string;
  numGuests: number;
  checkIn: string;
  checkOut: string;
  message?: string | null;
  adminMessage?: string | null;
}

// 1. Email to admin: new booking request received
export async function sendAdminNewRequestEmail(booking: BookingDetails) {
  if (!ADMIN_EMAIL) {
    console.warn('ADMIN_EMAIL not set, skipping admin notification');
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const approveToken = generateApprovalToken(booking.bookingId, 'approve');
  const rejectToken = generateApprovalToken(booking.bookingId, 'reject');
  const approveUrl = `${baseUrl}/api/bookings/${booking.bookingId}/action?token=${approveToken}`;
  const rejectUrl = `${baseUrl}/api/bookings/${booking.bookingId}/action?token=${rejectToken}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New booking request from ${booking.guestName}`,
      html: baseTemplate(`
        <h2 style="margin:0 0 16px;color:#3E372F;font-size:20px;font-weight:500;">
          New Booking Request
        </h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#5E544A;">
          <tr>
            <td style="padding:8px 0;color:#9A8F80;">Guest</td>
            <td style="padding:8px 0;text-align:right;font-weight:500;">${booking.guestName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9A8F80;">Email</td>
            <td style="padding:8px 0;text-align:right;">${booking.guestEmail}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9A8F80;">Dates</td>
            <td style="padding:8px 0;text-align:right;font-weight:500;">${booking.checkIn} &rarr; ${booking.checkOut}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9A8F80;">Guests</td>
            <td style="padding:8px 0;text-align:right;">${booking.numGuests}</td>
          </tr>
          ${booking.message ? `
          <tr>
            <td style="padding:8px 0;color:#9A8F80;">Message</td>
            <td style="padding:8px 0;text-align:right;font-style:italic;">&ldquo;${booking.message}&rdquo;</td>
          </tr>
          ` : ''}
        </table>
        <div style="margin:24px 0 0;text-align:center;">
          <a href="${approveUrl}"
             style="display:inline-block;padding:10px 28px;background:#16a34a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;margin-right:8px;">
            Approve
          </a>
          <a href="${rejectUrl}"
             style="display:inline-block;padding:10px 28px;background:#dc2626;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">
            Reject
          </a>
        </div>
        <p style="margin:16px 0 0;text-align:center;">
          <a href="${baseUrl}/admin"
             style="color:#9A8F80;font-size:12px;text-decoration:underline;">
            or open dashboard
          </a>
        </p>
      `),
    });
  } catch (error) {
    console.error('Failed to send admin notification email:', error);
  }
}

// 2. Email to guest: request received confirmation
export async function sendGuestConfirmationEmail(booking: BookingDetails) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.guestEmail,
      subject: 'Booking request received — Casa STFU',
      html: baseTemplate(`
        <h2 style="margin:0 0 8px;color:#3E372F;font-size:20px;font-weight:500;">
          Request Received!
        </h2>
        <p style="color:#7D7166;font-size:14px;line-height:1.6;margin:0 0 20px;">
          Hi ${booking.guestName}, thanks for your booking request. We&rsquo;ll review it and get back to you within 24 hours.
        </p>
        <div style="background:#FAF9F7;border-radius:8px;padding:16px;font-size:14px;color:#5E544A;">
          <p style="margin:0 0 4px;"><strong>Dates:</strong> ${booking.checkIn} &rarr; ${booking.checkOut}</p>
          <p style="margin:0;"><strong>Guests:</strong> ${booking.numGuests}</p>
        </div>
        <p style="color:#9A8F80;font-size:13px;margin:20px 0 0;">
          You&rsquo;ll receive another email once your request has been reviewed.
        </p>
      `),
    });
  } catch (error) {
    console.error('Failed to send guest confirmation email:', error);
  }
}

// 3. Email to guest: booking approved (with .ics calendar invite attached)
export async function sendGuestApprovedEmail(booking: BookingDetails) {
  const icsContent = generateIcsInvite({
    bookingId: booking.bookingId,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    numGuests: booking.numGuests,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
  });
  const icsBase64 = icsToBase64(icsContent);

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.guestEmail,
      subject: 'Your stay is confirmed! — Casa STFU',
      html: baseTemplate(`
        <h2 style="margin:0 0 8px;color:#3E372F;font-size:20px;font-weight:500;">
          You&rsquo;re All Set! &#127881;
        </h2>
        <p style="color:#7D7166;font-size:14px;line-height:1.6;margin:0 0 20px;">
          Hi ${booking.guestName}, great news &mdash; your stay has been approved! A calendar invite is attached.
        </p>
        <div style="background:#FAF9F7;border-radius:8px;padding:16px;font-size:14px;color:#5E544A;">
          <p style="margin:0 0 4px;"><strong>Check-in:</strong> ${booking.checkIn}</p>
          <p style="margin:0 0 4px;"><strong>Check-out:</strong> ${booking.checkOut}</p>
          <p style="margin:0;"><strong>Guests:</strong> ${booking.numGuests}</p>
        </div>
        ${booking.adminMessage ? `
        <div style="margin:16px 0 0;padding:12px 16px;border-left:3px solid #6B7FA3;background:#f5f7fa;border-radius:0 8px 8px 0;">
          <p style="margin:0;color:#5E544A;font-size:14px;">
            <strong>Note from host:</strong> ${booking.adminMessage}
          </p>
        </div>
        ` : ''}
        <p style="color:#7D7166;font-size:14px;line-height:1.6;margin:20px 0 0;">
          The apartment is located at <strong>1550 Mission St, Apt 1903, San Francisco, CA 94103</strong>. We look forward to hosting you!
        </p>
      `),
      attachments: [
        {
          filename: 'casa-stfu-booking.ics',
          content: icsBase64,
          contentType: 'text/calendar; method=REQUEST',
        },
      ],
    });
  } catch (error) {
    console.error('Failed to send guest approved email:', error);
  }
}

// 4. Email to guest: booking rejected
export async function sendGuestRejectedEmail(booking: BookingDetails) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.guestEmail,
      subject: 'Booking update — Casa STFU',
      html: baseTemplate(`
        <h2 style="margin:0 0 8px;color:#3E372F;font-size:20px;font-weight:500;">
          Booking Update
        </h2>
        <p style="color:#7D7166;font-size:14px;line-height:1.6;margin:0 0 20px;">
          Hi ${booking.guestName}, unfortunately we&rsquo;re unable to accommodate your stay for the requested dates.
        </p>
        <div style="background:#FAF9F7;border-radius:8px;padding:16px;font-size:14px;color:#5E544A;">
          <p style="margin:0 0 4px;"><strong>Dates:</strong> ${booking.checkIn} &rarr; ${booking.checkOut}</p>
        </div>
        ${booking.adminMessage ? `
        <div style="margin:16px 0 0;padding:12px 16px;border-left:3px solid #6B7FA3;background:#f5f7fa;border-radius:0 8px 8px 0;">
          <p style="margin:0;color:#5E544A;font-size:14px;">
            <strong>Note from host:</strong> ${booking.adminMessage}
          </p>
        </div>
        ` : ''}
        <p style="color:#9A8F80;font-size:13px;margin:20px 0 0;">
          Feel free to check availability for alternative dates.
        </p>
      `),
    });
  } catch (error) {
    console.error('Failed to send guest rejected email:', error);
  }
}

// 5. Email .ics calendar invite to hosts so it appears on their calendars
export async function sendHostCalendarInvite(booking: BookingDetails, isCancellation: boolean = false) {
  const icsContent = generateIcsInvite({
    bookingId: booking.bookingId,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    numGuests: booking.numGuests,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    isCancellation,
  });
  const icsBase64 = icsToBase64(icsContent);

  const subject = isCancellation
    ? `Cancelled: Casa STFU — ${booking.guestName} (${booking.checkIn} → ${booking.checkOut})`
    : `Casa STFU: ${booking.guestName} (${booking.checkIn} → ${booking.checkOut})`;

  const bodyText = isCancellation
    ? `The booking for ${booking.guestName} (${booking.checkIn} → ${booking.checkOut}) has been cancelled. The attached calendar invite will remove the event from your calendar.`
    : `A new booking has been confirmed for ${booking.guestName} (${booking.numGuests} guest${booking.numGuests !== 1 ? 's' : ''}). The attached calendar invite will add it to your calendar.`;

  const method = isCancellation ? 'CANCEL' : 'REQUEST';

  for (const hostEmail of HOST_EMAILS) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: hostEmail,
        subject,
        html: baseTemplate(`
          <h2 style="margin:0 0 8px;color:#3E372F;font-size:20px;font-weight:500;">
            ${isCancellation ? 'Booking Cancelled' : 'New Confirmed Booking'}
          </h2>
          <p style="color:#7D7166;font-size:14px;line-height:1.6;margin:0 0 20px;">
            ${bodyText}
          </p>
          <div style="background:#FAF9F7;border-radius:8px;padding:16px;font-size:14px;color:#5E544A;">
            <p style="margin:0 0 4px;"><strong>Guest:</strong> ${booking.guestName}</p>
            <p style="margin:0 0 4px;"><strong>Dates:</strong> ${booking.checkIn} &rarr; ${booking.checkOut}</p>
            <p style="margin:0;"><strong>Guests:</strong> ${booking.numGuests}</p>
          </div>
        `),
        attachments: [
          {
            filename: isCancellation ? 'casa-stfu-cancellation.ics' : 'casa-stfu-booking.ics',
            content: icsBase64,
            contentType: `text/calendar; method=${method}`,
          },
        ],
      });
    } catch (error) {
      console.error(`Failed to send host calendar invite to ${hostEmail}:`, error);
    }
  }
}
