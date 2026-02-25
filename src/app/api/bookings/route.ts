import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { bookings, blackoutDates } from '@/lib/db/schema';
import { bookingRequestSchema } from '@/lib/validations/booking';
import { and, eq, gte, lte, or, desc } from 'drizzle-orm';
import { addDays, format } from 'date-fns';
import { verifyAdminFromRequest } from '@/lib/auth';
import { sendAdminNewRequestEmail, sendGuestConfirmationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!verifyAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const validStatuses = ['pending', 'approved', 'rejected'] as const;
    const isValidStatus = (s: string): s is typeof validStatuses[number] =>
      validStatuses.includes(s as typeof validStatuses[number]);

    const results = status && isValidStatus(status)
      ? await db.select().from(bookings).where(eq(bookings.status, status)).orderBy(desc(bookings.createdAt))
      : await db.select().from(bookings).orderBy(desc(bookings.createdAt));
    return NextResponse.json({ bookings: results });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const result = bookingRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { guest_name, guest_email, num_guests, check_in, check_out, message } = result.data;

    const db = getDb();

    // Server-side: check dates are not in the past
    const today = format(new Date(), 'yyyy-MM-dd');
    if (check_in < today) {
      return NextResponse.json(
        { error: 'Check-in date cannot be in the past' },
        { status: 400 }
      );
    }

    // Server-side: check for blackout date conflicts
    const conflictingBlackouts = await db
      .select({ id: blackoutDates.id })
      .from(blackoutDates)
      .where(
        and(
          lte(blackoutDates.startDate, check_out),
          gte(blackoutDates.endDate, check_in)
        )
      );

    if (conflictingBlackouts.length > 0) {
      return NextResponse.json(
        { error: 'Selected dates overlap with unavailable dates' },
        { status: 409 }
      );
    }

    // Server-side: check for approved booking conflicts (including 2-day buffer)
    // A new booking conflicts if its range overlaps with [checkIn, checkOut + 2 buffer days]
    const conflictingBookings = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, 'approved'),
          or(
            // New booking's check-in falls within existing booking + buffer
            and(
              lte(bookings.checkIn, check_out),
              gte(bookings.checkOut, check_in)
            ),
            // New booking overlaps with buffer period after existing booking
            and(
              lte(bookings.checkOut, check_in),
              gte(
                // checkOut + 2 days buffer
                bookings.checkOut,
                format(addDays(new Date(check_in), -2), 'yyyy-MM-dd')
              )
            )
          )
        )
      );

    if (conflictingBookings.length > 0) {
      return NextResponse.json(
        { error: 'Selected dates conflict with an existing booking' },
        { status: 409 }
      );
    }

    // Insert the booking request
    const [newBooking] = await db
      .insert(bookings)
      .values({
        guestName: guest_name,
        guestEmail: guest_email,
        numGuests: num_guests,
        checkIn: check_in,
        checkOut: check_out,
        message: message || null,
      })
      .returning({ id: bookings.id, status: bookings.status });

    // Send email notifications (don't block the response)
    const emailDetails = {
      guestName: guest_name,
      guestEmail: guest_email,
      numGuests: num_guests,
      checkIn: check_in,
      checkOut: check_out,
      message: message || null,
    };

    sendAdminNewRequestEmail(emailDetails).catch((err) => console.error('Admin email failed:', err));
    sendGuestConfirmationEmail(emailDetails).catch((err) => console.error('Guest confirmation email failed:', err));

    return NextResponse.json(
      {
        message: 'Booking request submitted successfully',
        booking: newBooking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to submit booking request' },
      { status: 500 }
    );
  }
}
