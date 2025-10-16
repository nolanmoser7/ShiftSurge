# Shift Surge

## Overview

Shift Surge is a Progressive Web Application (PWA) designed to connect service-industry workers with exclusive restaurant promotions. The platform empowers restaurants to create and manage targeted deals, while workers can easily discover, claim, and redeem offers through a mobile-first interface. A dedicated superadmin dashboard provides comprehensive platform management capabilities.

**Core Value Proposition:**
- **For Workers**: Instant access to exclusive local restaurant deals with streamlined claim/redeem processes.
- **For Restaurants**: Tools for targeted promotion management, real-time analytics, and audience segmentation.
- **For Superadmins**: Full platform oversight including user management, audit logging, and business metrics.

## Recent Updates

### October 16, 2025 - Codebase Cleanup & Admin Routing Fix
- **Removed unused files:** Deleted `server/db.ts` and `server/db-direct.ts` (legacy Drizzle connection files)
- **Cleaned up storage layer:** Removed 200+ lines of commented legacy Drizzle implementation from `server/storage.ts`
- **Fixed admin routing:** Added redirect routes from `/admin` and `/superadmin` to `/admin/dashboard` for better UX
- **Neighborhoods table:** Infrastructure kept for future location-based features (currently unused)
- **Verified admin flow:** All admin pages, navigation, invite generation, and logout tested successfully

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with **React, TypeScript, and Vite**, optimized as a PWA. The UI leverages **Tailwind CSS and shadcn/ui** (based on Radix UI primitives) to implement a dual design language: a vibrant orange-red for the worker experience and a professional deep blue for the restaurant dashboard, both supporting dark mode. Client-side routing is handled by **Wouter**, with role-based protection. State management utilizes **TanStack Query** for server state, a Context API for authentication, and React Hook Form with Zod for form management.

### Backend Architecture

The backend is an **Express.js** application written in TypeScript, employing session-based authentication with `express-session` and a PostgreSQL session store. It features custom middleware for role-based access control (`requireAuth`, `requireWorker`, `requireRestaurant`). The API follows a RESTful design under the `/api` prefix, with standardized JSON error responses. A storage layer abstracts Drizzle ORM operations, providing methods for user/profile management, promotion lifecycle, claim handling, and analytics.

### Database Schema

The project uses **Supabase PostgreSQL** as its primary data store. Key tables include `users` (for authentication and roles), `worker_profiles`, `restaurant_profiles`, `promotions`, `claims`, `redemptions`, `organizations` (for restaurant management and onboarding), and `audit_logs` (for superadmin actions). Design decisions include VARCHAR primary keys with `gen_random_uuid()`, PostgreSQL enums for roles and statuses, and a direct relationship between `promotions` and `restaurant_profiles`. Supabase client is used directly, with Drizzle schema definitions providing TypeScript types.

**Worker Positions:** The `worker_role` enum includes: server, bartender, barback, busser/foodrunner, chef, cook, dishwasher, host, manager, other.

**Active Staff Tracking:** The `organizations` table tracks `active_staff` (count of workers) and `max_employees` (limit set during onboarding). Worker signup validates against this limit and increments the counter atomically.

### Design System

The design system uses **CSS custom properties** for theme-aware colors, supporting separate palettes for worker and restaurant experiences, and a dark mode toggle. Component patterns include `hover-elevate` and `active-elevate-2` utility classes for interactive elements, and a subtle shadow system. The design is **mobile-first**, responsive, and touch-optimized.

### Restaurant Onboarding System

A key feature is an invite-based onboarding flow for restaurant managers. Super admins generate daily-expiring QR code invites. Managers sign up using these tokens, which creates their user account with a 'restaurant' role. Upon first login, a 2-step wizard guides them through setting up their restaurant organization, including **Google Places Autocomplete search** for restaurant details (address, phone, rating, business hours, coordinates), defining an employee limit, and selecting business goals. The system integrates securely with Google Places API, handling various URL formats and performing robust validation.

## External Dependencies

-   **UI Component Library:** shadcn/ui with Radix UI primitives, class-variance-authority, Lucide React (icons).
-   **Database:** Supabase PostgreSQL (@supabase/supabase-js client), Drizzle (for types), drizzle-zod.
-   **Authentication & Sessions:** Express session, connect-pg-simple, Node.js crypto module (scrypt).
-   **State & Data Fetching:** TanStack Query v5, React Hook Form, Zod.
-   **Styling:** Tailwind CSS v3, PostCSS, Google Fonts (Inter, Poppins), clsx, tailwind-merge.
-   **Utilities:** date-fns, embla-carousel-react, nanoid, wouter, qrcode.react.
-   **Google Places API:** Integrated for restaurant details lookup during onboarding, secured with `GOOGLE_PLACES_API_KEY`.