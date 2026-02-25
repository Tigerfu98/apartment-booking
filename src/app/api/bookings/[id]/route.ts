import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdminFromRequest } from '@/lib/auth';
import { sendGuestApprovedEmail, sendGuestRejectedEmail } from '@/lib/email';
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

    // Verify booking exists and is pending
    const [existing] = await db
      .select({ id: bookings.id, status: bookings.status })
      .from(bookings)
      .where(eq(bookings.id, id));

    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (existing.status !== 'pending') {
      return NextResponse.json(
        { error: `Booking is already ${existing.status}` },
        { status: 409 }
      );
    }

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
      guestName: updated.guestName,
      guestEmail: updated.guestEmail,
      numGuests: updated.numGuests,
      checkIn: updated.checkIn,
      checkOut: updated.checkOut,
      adminMessage: updated.adminMessage,
    };

    if (status === 'approved') {
      sendGuestApprovedEmail(emailDetails).catch(() => {});
    } else {
      sendGuestRejectedEmail(emailDetails).catch(() => {});
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
