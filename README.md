# JARVE Agency Webapp

A modern Next.js webapp for JARVE Agency featuring a public marketing site and an integrated CRM dashboard.

## Features

### Public Site
- **Landing Page**: Modern hero section with strong copy emphasizing fast webapps, AI integrations, and MVPs
- **Services Section**: Showcases Web Apps, iOS Apps, MVPs, and AI Integrations
- **Contact Form**: Integrated with Supabase to capture leads directly into the CRM

### CRM Dashboard (`/app`)
- **Protected Routes**: Secure access via Next.js Middleware and Supabase Auth
- **Dashboard**: Overview with stats on leads, projects, and clients
- **Leads Management**: Track and update lead status (New → Contacted → Converted → Closed)
- **Projects Tracking**: Manage projects with types (Web, iOS, MVP, Integration) and statuses
- **Clients Management**: Store and manage client information

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS + Shadcn UI
- **Backend**: Supabase (PostgreSQL + Auth)
- **TypeScript**: Full type safety

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   The `.env.local` file should already be configured with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://yshnntmnlsglefjtmtxv.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Database**
   The database schema has been created via Supabase migrations:
   - `leads` table for contact form submissions
   - `clients` table for client management
   - `agency_projects` table for project tracking

4. **Authentication**
   Create an admin user in Supabase:
   - Go to Supabase Dashboard → Authentication → Users
   - Create a new user with email/password
   - Use these credentials to log in at `/login`

5. **Run Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the public site.
   Navigate to [http://localhost:3000/login](http://localhost:3000/login) to access the CRM.

## Project Structure

```
jarve-agency/
├── app/
│   ├── app/              # Protected CRM routes
│   │   ├── page.tsx      # Dashboard
│   │   ├── leads/        # Leads management
│   │   ├── projects/     # Projects tracking
│   │   └── clients/      # Clients management
│   ├── login/            # Login page
│   ├── layout.tsx        # Root layout with theme provider
│   └── page.tsx          # Public landing page
├── components/
│   ├── ui/               # Shadcn UI components
│   ├── hero-section.tsx
│   ├── services-section.tsx
│   ├── contact-form.tsx
│   └── footer.tsx
├── utils/
│   └── supabase/         # Supabase client utilities
└── middleware.ts         # Auth protection for /app routes
```

## Security

- All `/app` routes are protected by Next.js Middleware
- Row Level Security (RLS) policies are enabled on all tables
- Public contact form can insert leads (anon policy)
- Only authenticated users can access CRM data

## Next Steps

1. Create your admin user in Supabase
2. Customize the branding and copy
3. Add more CRM features as needed
4. Deploy to production (Vercel recommended)
