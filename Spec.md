Apartment Booking Tool — Product Spec & Claude Code Instructions
Part 2: Product Spec
Overview
A private, invite-only web app where friends and family can view availability and request to book a weekend stay at Tiger's SF apartment. No payments, no public access, no user accounts. Tiger approves/rejects all requests via an admin dashboard.
One-liner: "A lightweight Airbnb for one apartment, one admin, and a trusted guest list."
Users & Personas
PersonaDescriptionKey needsGuest (friends/family)Receives link to the site, browses availability, submits a booking requestSee open dates at a glance, submit request in <60 seconds, get confirmation/rejection via emailAdmin (Tiger)Manages availability, reviews requests, controls blackout datesApprove/reject from dashboard, sync to Google Calendar, email notifications on new requests
Guest-Facing Experience
Landing Page:
* Hero image: Golden Gate Bridge (high-quality stock photo, full-width)
* Brief welcome copy (e.g., "Welcome! Check availability and request your stay.")
* Interactive availability calendar (month view, color-coded: available / booked / blackout)
* Local area guide section — curated recommendations (restaurants, walks, coffee, things to do)
* No login required
Booking Request Flow:
1. Guest selects check-in and check-out dates on the calendar
2. Calendar enforces rules (grays out unavailable, shows min/max stay)
3. Guest fills a short form: Name, Email, Number of guests, Optional message
4. Guest sees confirmation: "Request submitted! You'll hear back within 24 hours."
5. Guest receives email confirmation of submission
6. Guest receives email when approved or rejected (with optional admin message)
Admin Experience
Admin Dashboard (password-protected route, e.g., /admin):
* View all booking requests (pending / approved / rejected / past)
* Approve or reject with optional message to guest
* Manage blackout dates (add/remove date ranges)
* View upcoming bookings in list and calendar view
* Simple auth: single admin password (environment variable, no user system needed)
Notifications:
* Email to admin when a new request comes in
* Email to guest on approval/rejection
Google Calendar Sync:
* On approval, create a Google Calendar event with guest name + dates
* On rejection or cancellation, remove the event
Booking Rules & Constraints
RuleValueMinimum stay1 nightMaximum stay5 nightsBuffer between bookings2 days (auto-blocked after each approved booking)Blackout datesAdmin-managed, shown as unavailable on calendarOverlapping requestsAllowed (admin picks the one to approve)Max guests per bookingNot enforced (captured in form for info only)
Tech Stack Recommendation
Optimized for: free hosting, simplicity, first Claude Code project, single developer.
LayerChoiceWhyFrameworkNext.js 14+ (App Router)Full-stack in one project, deploys free on Vercel, great DXDatabaseSupabase (PostgreSQL)Free tier generous (500MB, 50K rows), real-time capable, good admin SDKStylingTailwind CSSFast iteration, no design system neededCalendar UIreact-day-picker or similarLightweight, customizable, handles date ranges wellEmailResend (free tier: 100 emails/day)Simple API, works great with Next.jsGoogle CalendarGoogle Calendar API (service account)Server-side sync, no OAuth flow needed for admin-only useAuth (admin only)Simple middleware check against env varNo auth library overhead for a single admin passwordHostingVercel (free tier)Zero-config Next.js deploys, generous free tier
Data Model
bookings ├── id (uuid, primary key) ├── guest_name (text) ├── guest_email (text) ├── num_guests (integer) ├── check_in (date) ├── check_out (date) ├── message (text, nullable) ├── status (enum: pending | approved | rejected) ├── admin_message (text, nullable) ├── google_calendar_event_id (text, nullable) ├── created_at (timestamp) ├── updated_at (timestamp)  blackout_dates ├── id (uuid, primary key) ├── start_date (date) ├── end_date (date) ├── reason (text, nullable) ├── created_at (timestamp)
Pages & Routes
RoutePurposeAuth/Landing page + calendar + booking form + area guidePublic/adminDashboard: manage requests, blackout dates, view calendarPassword/api/bookingsPOST: create request, GET: list (admin)Public / Admin/api/bookings/[id]PATCH: approve/rejectAdmin/api/blackout-datesCRUD for blackout datesAdmin/api/availabilityGET: returns available dates for calendarPublic
Non-Goals (V1)
* No payment processing
* No user accounts or OAuth for guests
* No multi-property support
* No automated pricing
* No mobile app (responsive web is sufficient)
* No real-time chat or messaging
