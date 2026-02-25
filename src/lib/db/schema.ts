import { pgTable, uuid, text, integer, date, timestamp, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guestName: text('guest_name').notNull(),
    guestEmail: text('guest_email').notNull(),
    numGuests: integer('num_guests').notNull(),
    checkIn: date('check_in').notNull(),
    checkOut: date('check_out').notNull(),
    message: text('message'),
    status: text('status', { enum: ['pending', 'approved', 'rejected'] })
      .notNull()
      .default('pending'),
    adminMessage: text('admin_message'),
    googleCalendarEventId: text('google_calendar_event_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('check_out_after_check_in', sql`${table.checkOut} > ${table.checkIn}`),
  ]
);

export const blackoutDates = pgTable(
  'blackout_dates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('end_after_start', sql`${table.endDate} >= ${table.startDate}`),
  ]
);

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type BookingStatus = Booking['status'];

export type BlackoutDate = typeof blackoutDates.$inferSelect;
export type NewBlackoutDate = typeof blackoutDates.$inferInsert;
