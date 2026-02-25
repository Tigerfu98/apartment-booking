# Casa STFU

Private booking tool for Tiger & Sarah's apartment in San Francisco. Friends and family can view availability and request stays. The admin approves or rejects requests via a dashboard or directly from email.

## Tech Stack

- **Next.js 16** (App Router) with TypeScript
- **Neon** (PostgreSQL) + Drizzle ORM
- **Tailwind CSS v4** for styling
- **react-day-picker** for calendar UI
- **Resend** for transactional email
- **.ics calendar invites** generated in code (no external calendar API)
- Deployed on **Vercel**

## Features

- **Guest landing page** — Hero, interactive availability calendar, booking request form, location map, area guide
- **Admin dashboard** — Password-protected at `/admin` with booking management, calendar view, blackout date management
- **Email notifications** — Automated emails on booking request, approval, and rejection
- **One-click email actions** — Approve/reject bookings directly from the admin notification email (HMAC-signed tokens, 72h expiry)
- **Calendar invites** — `.ics` files attached to approval emails for guest + hosts
- **Cancellation flow** — Cancel approved bookings with cancellation `.ics` sent to all parties
- **2-day buffer** — Enforced between bookings (server-side validated)
- **1-5 night limits** — Enforced client and server side

## Local Development

### Prerequisites

- Node.js 18+
- npm
- A [Neon](https://neon.tech) database
- A [Resend](https://resend.com) account

### Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/Tigerfu98/apartment-booking.git
   cd apartment-booking
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Then fill in the values (see [Environment Variables](#environment-variables) below).

4. **Push the database schema**

   ```bash
   npx drizzle-kit push
   ```

5. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx drizzle-kit push` | Push schema changes to Neon |

## Environment Variables

Create a `.env.local` file with the following:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |
| `ADMIN_PASSWORD` | Password for the admin dashboard | Yes |
| `RESEND_API_KEY` | Resend API key for sending emails | Yes |
| `ADMIN_EMAIL` | Email address to receive admin notifications | Yes |
| `ADMIN_SECRET` | Random secret for HMAC-signing email approval tokens. Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | Yes |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app (e.g., `https://your-app.vercel.app`). Used for email links. | Yes |

## Neon Database Setup

1. Go to [neon.tech](https://neon.tech) and create a free project
2. Copy the connection string from the dashboard
3. Paste it as `DATABASE_URL` in `.env.local`
4. Run `npx drizzle-kit push` to create the tables

The schema includes two tables:
- **bookings** — guest info, dates, status (pending/approved/rejected), messages
- **blackout_dates** — date ranges when the apartment is unavailable

## Resend Email Setup

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Set `RESEND_API_KEY` in `.env.local`

**Important:** The default sender (`onboarding@resend.dev`) is Resend's sandbox domain and can only send to the email on your Resend account. To send to guests and other recipients, add and verify your own domain in the Resend dashboard, then update `FROM_EMAIL` in `src/lib/email.ts`.

## Vercel Deployment

1. **Install the Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Deploy**

   ```bash
   vercel
   ```

   Follow the prompts to link to your Vercel account and project.

3. **Set environment variables**

   Set all variables from `.env.local` on your Vercel project:

   ```bash
   vercel env add DATABASE_URL
   vercel env add ADMIN_PASSWORD
   vercel env add RESEND_API_KEY
   vercel env add ADMIN_EMAIL
   vercel env add ADMIN_SECRET
   vercel env add NEXT_PUBLIC_APP_URL
   ```

   Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL (e.g., `https://apartment-booking.vercel.app`).

4. **Redeploy** to pick up the environment variables:

   ```bash
   vercel --prod
   ```

## Project Structure

```
src/
  app/
    page.tsx              # Guest landing page
    layout.tsx            # Root layout with metadata
    globals.css           # Tailwind config + custom colors
    admin/
      page.tsx            # Admin dashboard (client component)
      layout.tsx          # Admin metadata (noindex)
    api/
      auth/               # Admin login/logout/check
      availability/       # GET unavailable dates
      bookings/           # CRUD bookings
        [id]/
          route.ts        # PATCH (approve/reject), DELETE
          action/
            route.ts      # GET email-based approve/reject
      blackout-dates/     # CRUD blackout dates
  components/
    Hero.tsx              # Landing page hero
    AvailabilityCalendar.tsx  # Interactive date picker
    BookingForm.tsx        # Booking request form
    BookingSection.tsx     # Calendar + form wrapper
    Location.tsx           # Google Maps embed
    AreaGuide.tsx          # Local recommendations
    admin/
      AdminLogin.tsx       # Password login
      AdminDashboard.tsx   # Tabbed dashboard
      BookingList.tsx      # Booking list with actions
      AdminCalendarView.tsx  # Calendar overview
      BlackoutManager.tsx  # Blackout date management
  lib/
    auth.ts               # Cookie-based admin auth
    calendar.ts           # .ics file generation
    email.ts              # Resend email functions
    email-token.ts        # HMAC token generation/verification
    db/
      index.ts            # Neon database client
      schema.ts           # Drizzle ORM schema
    validations/
      booking.ts          # Zod validation schemas
```
