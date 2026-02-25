import { z } from 'zod';

export const bookingRequestSchema = z
  .object({
    guest_name: z.string().min(1, 'Name is required'),
    guest_email: z.string().email('Invalid email address'),
    num_guests: z.number().int().min(1, 'At least 1 guest required'),
    check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    message: z.string().optional(),
  })
  .refine(
    (data) => new Date(data.check_out) > new Date(data.check_in),
    { message: 'Check-out must be after check-in', path: ['check_out'] }
  )
  .refine(
    (data) => {
      const checkIn = new Date(data.check_in);
      const checkOut = new Date(data.check_out);
      const nights = Math.round(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );
      return nights >= 1 && nights <= 5;
    },
    { message: 'Stay must be between 1 and 5 nights', path: ['check_out'] }
  );

export type BookingRequest = z.infer<typeof bookingRequestSchema>;
