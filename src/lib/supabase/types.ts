export type BookingStatus = 'pending' | 'approved' | 'rejected';

export interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  num_guests: number;
  check_in: string;
  check_out: string;
  message: string | null;
  status: BookingStatus;
  admin_message: string | null;
  google_calendar_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlackoutDate {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'status' | 'admin_message' | 'google_calendar_event_id'> & {
          id?: string;
          status?: BookingStatus;
          admin_message?: string | null;
          google_calendar_event_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Booking, 'id' | 'created_at'>>;
      };
      blackout_dates: {
        Row: BlackoutDate;
        Insert: Omit<BlackoutDate, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<BlackoutDate, 'id' | 'created_at'>>;
      };
    };
  };
}
