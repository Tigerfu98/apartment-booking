# CLAUDE.md — Apartment Booking Tool
## Project Overview
Private booking tool for a single SF apartment. Friends & family view availability and request stays. Admin (single user) approves/rejects via dashboard.
## Tech Stack
- Next.js 14+ (App Router) with TypeScript
- Neon (PostgreSQL) + Drizzle ORM for database
- Tailwind CSS for styling
- react-day-picker for calendar
- Resend for transactional email
- .ics calendar invites (generated in code, no external API)
- Deployed on Vercel
## Commands
- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx drizzle-kit push` — push schema to Neon
## Code Conventions
- Use TypeScript strict mode
- Use Server Components by default, Client Components only when needed (interactivity)
- Use Server Actions for mutations
- Keep components in `/src/components/`, pages in `/src/app/`
- Use environment variables for all secrets (DATABASE_URL, Resend API key, admin password)
- Write Zod schemas for all form validation
- Commit after completing each milestone with descriptive messages
## Design Guidelines
- Clean, minimal aesthetic — think "boutique hotel website"
- Golden Gate Bridge hero image (use Unsplash URL or placeholder)
- Neutral color palette: white, warm grays, subtle accent color (slate blue or warm gold)
- Mobile-responsive (guests will often view on phones)
- Calendar should be the visual centerpiece of the landing page
## Important Rules
- NEVER expose admin password in client-side code
- NEVER skip the 2-day buffer between bookings
- ALWAYS validate date ranges server-side (don't trust client)
- ALWAYS send email notifications on booking request AND status change
