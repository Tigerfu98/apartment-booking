import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdminFromRequest } from '@/lib/auth';
import { sendGuestApprovedEmail, sendGuestRejectedEmail, sendHostCalendarInvite } from '@/lib/email';
import { z } from 'zod';

const updateBookingSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  admin_message: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const result = updateBookingSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status, admin_message } = result.data;
    const db = getDb();

    // Verify booking exists
    const [existing] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id));

    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Allow: pending → approved, pending → rejected, approved → rejected (cancellation)
    if (existing.status === 'rejected') {
      return NextResponse.json(
        { error: 'Booking is already rejected' },
        { status: 409 }
      );
    }

    if (existing.status === 'approved' && status === 'approved') {
      return NextResponse.json(
        { error: 'Booking is already approved' },
        { status: 409 }
      );
    }

    const wasApproved = existing.status === 'approved';

    const [updated] = await db
      .update(bookings)
      .set({
        status,
        adminMessage: admin_message || null,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, id))
      .returning();

    // Send email notification to guest (don't block the response)
    const emailDetails = {
      bookingId: updated.id,
      guestName: updated.guestName,
      guestEmail: updated.guestEmail,
      numGuests: updated.numGuests,
      checkIn: updated.checkIn,
      checkOut: updated.checkOut,
      adminMessage: updated.adminMessage,
    };

    if (status === 'approved') {
      // Approved: send guest approval email + host calendar invites
      sendGuestApprovedEmail(emailDetails).catch((err) => console.error('Guest approved email failed:', err));
      sendHostCalendarInvite(emailDetails, false).catch((err) => console.error('Host calendar invite failed:', err));
    } else if (status === 'rejected' && wasApproved) {
      // Cancellation (was approved, now rejected): send guest rejection + cancellation .ics to hosts
      sendGuestRejectedEmail(emailDetails).catch((err) => console.error('Guest rejected email failed:', err));
      sendHostCalendarInvite(emailDetails, true).catch((err) => console.error('Host cancellation invite failed:', err));
    } else {
      // Rejected from pending: just send rejection email
      sendGuestRejectedEmail(emailDetails).catch((err) => console.error('Guest rejected email failed:', err));
    }

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const db = getDb();

    const [deleted] = await db
      .delete(bookings)
      .where(eq(bookings.id, id))
      .returning({ id: bookings.id });

    if (!deleted) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}
