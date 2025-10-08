# Shift Surge

## Overview

Shift Surge is a progressive web application (PWA) that connects service-industry workers with exclusive restaurant promotions. The platform enables restaurants to create and manage targeted deals while workers can discover, claim, and redeem offers through a mobile-first interface.

**Core Value Proposition:**
- **For Workers**: Instant access to exclusive deals from local restaurants with simple claim/redeem workflows
- **For Restaurants**: Targeted promotion management with real-time analytics and audience segmentation

**Tech Stack Summary:**
- Frontend: React + TypeScript + Vite (PWA-ready)
- UI: Tailwind CSS + shadcn/ui (Radix UI primitives)
- Backend: Express.js with session-based authentication
- Database: PostgreSQL via Drizzle ORM
- State Management: TanStack Query (server state)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Component Design System:**
- Built on shadcn/ui library with Radix UI primitives for accessibility
- Dual design language:
  - Worker experience: Vibrant orange-red (`hsl(24 95% 53%)`) with energy-focused UI
  - Restaurant dashboard: Professional deep blue (`hsl(220 75% 45%)`) with data-heavy components
- Typography: Inter for UI/body, Poppins for headings
- Full dark mode support with theme switching capability

**Routing & Pages:**
- Client-side routing via Wouter
- Three main routes:
  - `/` - Landing page with dual-audience hero sections
  - `/worker-feed` - Worker promotion discovery interface
  - `/restaurant-dashboard` - Restaurant analytics and promotion management
- Role-based route protection with automatic redirects

**State Management Strategy:**
- Server state: TanStack Query with infinite stale time (manual invalidation)
- Auth state: Context provider wrapping React Query hooks
- UI state: Local component state (no global UI store currently)
- Form state: React Hook Form with Zod validation

**PWA Implementation:**
- Vite configured for PWA support
- Mobile-first responsive design (768px breakpoint)
- Optimized for installability and offline capability (infrastructure ready)

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- Session-based authentication using `express-session`
- PostgreSQL session store via `connect-pg-simple`
- Custom middleware for role-based access control

**Authentication Flow:**
- Password hashing: Node.js `scrypt` with salt
- Session storage: PostgreSQL-backed sessions
- Role-based middleware:
  - `requireAuth`: Any authenticated user
  - `requireWorker`: Worker-only routes
  - `requireRestaurant`: Restaurant-only routes
- Auth state exposed via `AuthRequest` interface

**API Architecture:**
- RESTful endpoints under `/api` prefix
- Request/response logging middleware for debugging
- Error handling with standardized JSON responses
- Key endpoint groups:
  - `/api/auth/*` - Signup, login, logout, session check
  - `/api/promotions` - Public promotion feed
  - `/api/claims` - Worker claim operations
  - `/api/restaurant/promotions` - Restaurant promotion management

**Storage Layer (server/storage.ts):**
- Interface-based storage abstraction (`IStorage`)
- Drizzle ORM operations wrapped in reusable methods
- Core operations:
  - User/profile CRUD (workers, restaurants)
  - Promotion lifecycle (create, update, status changes)
  - Claim management with unique code generation
  - Redemption tracking
  - Analytics aggregation (impressions, claims, redemptions)

### Database Schema

**Core Tables:**
- `users` - Authentication (email, hashed password, role enum)
- `worker_profiles` - Worker details (name, role, verification status)
- `restaurant_profiles` - Restaurant details (name, address, logo)
- `promotions` - Deal definitions (title, description, discount, scheduling, status)
- `claims` - Worker claims with unique codes and expiration
- `redemptions` - Redemption records with timestamps

**Key Design Decisions:**
- UUID primary keys via `gen_random_uuid()`
- Enum types for roles and statuses (type safety + database constraints)
- Cascade deletes for referential integrity
- Timestamp tracking (created_at) on all entities
- Promotion status workflow: draft → active/scheduled → paused/expired

**ORM Strategy:**
- Drizzle ORM for type-safe queries
- Neon serverless driver for PostgreSQL
- Schema-first design with `drizzle-zod` for validation
- Migration management via `drizzle-kit push`

### Design System

**Color System:**
- CSS custom properties for theme-aware colors
- Separate palettes for worker/restaurant experiences
- Dark mode via CSS class toggle on root element
- Elevation system using rgba overlays (--elevate-1, --elevate-2)

**Component Patterns:**
- Hover states: `hover-elevate` utility class
- Active states: `active-elevate-2` for button presses
- Border treatment: Outline buttons inherit parent background color
- Shadow system: `shadow-xs` for subtle depth on elevated elements

**Responsive Strategy:**
- Mobile-first with 768px breakpoint
- Flexbox/Grid layouts for fluid scaling
- Touch-optimized interactive elements
- Viewport meta tag with maximum-scale=1

### Development Experience

**Build Configuration:**
- Vite for fast HMR and optimized production builds
- Path aliases: `@/` (client), `@shared/` (shared types), `@assets/` (images)
- TypeScript strict mode with comprehensive type checking
- Separate client and server build outputs

**Development Tools:**
- Replit-specific plugins for runtime errors and dev banner
- Source map support for debugging
- Hot module replacement in development
- File system restrictions for security

## External Dependencies

**UI Component Library:**
- shadcn/ui with Radix UI primitives (@radix-ui/*)
- Full suite of accessible components (dialogs, dropdowns, forms, etc.)
- Class-variance-authority for component variants
- Lucide React for iconography

**Database & ORM:**
- PostgreSQL database (connection via DATABASE_URL env variable)
- @neondatabase/serverless for serverless PostgreSQL driver
- Drizzle ORM v0.39.1 for type-safe queries
- drizzle-zod for schema-to-Zod validation

**Authentication & Sessions:**
- Express session middleware
- connect-pg-simple for PostgreSQL session storage
- Node.js crypto module for password hashing (scrypt)

**State & Data Fetching:**
- TanStack Query v5 for server state management
- React Hook Form with @hookform/resolvers for forms
- Zod for runtime validation

**Styling:**
- Tailwind CSS v3 with PostCSS
- Custom CSS variables for theme system
- Google Fonts: Inter and Poppins
- clsx + tailwind-merge for className composition

**Utilities:**
- date-fns for date formatting and manipulation
- embla-carousel-react for carousel components
- nanoid for unique ID generation (session/claim codes)
- wouter for lightweight client-side routing

**Development Dependencies:**
- TypeScript with ESNext module resolution
- Vite with React plugin
- tsx for running TypeScript in Node.js
- esbuild for production server bundle