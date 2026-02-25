import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { bookings, blackoutDates } from '@/lib/db/schema';
import { eq, gte, and } from 'drizzle-orm';
import { addDays, eachDayOfInterval, format, startOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const today = startOfDay(new Date());

    // Fetch approved bookings from today onward
    const approvedBookings = await db
      .select({
        checkIn: bookings.checkIn,
        checkOut: bookings.checkOut,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, 'approved'),
          gte(bookings.checkOut, format(today, 'yyyy-MM-dd'))
        )
      );

    // Fetch blackout dates from today onward
    const blackouts = await db
      .select({
        startDate: blackoutDates.startDate,
        endDate: blackoutDates.endDate,
      })
      .from(blackoutDates)
      .where(gte(blackoutDates.endDate, format(today, 'yyyy-MM-dd')));

    // Build set of unavailable date strings
    const unavailableDates = new Set<string>();

    // Add booked dates + 2-day buffer after each booking
    for (const booking of approvedBookings) {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);

      // Mark each day of the stay as unavailable
      const stayDays = eachDayOfInterval({ start: checkIn, end: addDays(checkOut, -1) });
      for (const day of stayDays) {
        unavailableDates.add(format(day, 'yyyy-MM-dd'));
      }

      // Mark 2-day buffer after checkout as unavailable
      const bufferDays = eachDayOfInterval({
        start: checkOut,
        end: addDays(checkOut, 1),
      });
      for (const day of bufferDays) {
        unavailableDates.add(format(day, 'yyyy-MM-dd'));
      }
    }

    // Add blackout dates
    for (const blackout of blackouts) {
      const start = new Date(blackout.startDate);
      const end = new Date(blackout.endDate);
      const days = eachDayOfInterval({ start, end });
      for (const day of days) {
        unavailableDates.add(format(day, 'yyyy-MM-dd'));
      }
    }

    return NextResponse.json({
      unavailableDates: Array.from(unavailableDates).sort(),
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}
