-- Bookings table
create table bookings (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  guest_email text not null,
  num_guests integer not null,
  check_in date not null,
  check_out date not null,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  admin_message text,
  google_calendar_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint check_out_after_check_in check (check_out > check_in)
);

create index idx_bookings_status on bookings (status);
create index idx_bookings_dates on bookings (check_in, check_out);

-- Auto-update updated_at on row change
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger bookings_updated_at
  before update on bookings
  for each row
  execute function update_updated_at();

-- Blackout dates table
create table blackout_dates (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now(),

  constraint end_after_start check (end_date >= start_date)
);
