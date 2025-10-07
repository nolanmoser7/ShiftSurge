# Shift Surge - Design Guidelines

## Design Approach

**Hybrid Approach: Material Design Foundation + Hospitality App Inspiration**

Drawing from DoorDash Merchant, Toast POS, and modern deal platforms, combined with Material Design principles for the data-heavy dashboard components. The design balances professional restaurant management tools with engaging, scroll-stopping promotion discovery for workers.

**Key Principles:**
- Instant clarity: Workers should understand value in <3 seconds
- Trust signals: Restaurant credibility through polished, professional UI
- Action-oriented: Every screen drives toward claim/redeem or promotion creation

---

## Core Design Elements

### A. Color Palette

**Restaurant Dashboard (Professional Trust)**
- Primary: 220 75% 45% (Deep professional blue)
- Secondary: 220 15% 25% (Charcoal gray)
- Success: 142 76% 36% (Green for active promotions)
- Warning: 38 92% 50% (Amber for expiring soon)
- Background Light: 220 15% 97%
- Background Dark: 220 20% 12%

**Worker Experience (Energy + Appetite Appeal)**
- Primary: 24 95% 53% (Vibrant orange-red, food industry energy)
- Accent: 142 76% 36% (Success green for claimed deals)
- Surface Light: 0 0% 98%
- Surface Dark: 220 18% 10%

**Dark Mode Implementation:**
- All form inputs: bg-slate-800 with border-slate-700
- Text fields: text-slate-100 with placeholder-slate-500
- Consistent dark surfaces throughout

### B. Typography

**Font Stack:**
- Primary: 'Inter' via Google Fonts (UI, body, forms)
- Display: 'Poppins' via Google Fonts (headings, promotion titles)

**Hierarchy:**
- Hero/Display: Poppins 600, 2.5rem-4rem
- Section Headers: Poppins 600, 1.5rem-2rem
- Body: Inter 400, 0.875rem-1rem
- Captions/Meta: Inter 400, 0.75rem-0.875rem

### C. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 8, 12, 16, 20
- Micro spacing: p-2, gap-2 (8px)
- Component padding: p-4, p-8 (16px, 32px)
- Section spacing: py-12, py-16, py-20 (48px, 64px, 80px)
- Card spacing: p-6 for cards, p-8 for larger containers

**Grid Systems:**
- Dashboard: 12-column grid (grid-cols-12) for analytics
- Promotion Feed: Masonry-style with grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Mobile: Always single column, stack vertically

---

## Component Library

### Restaurant Dashboard Components

**Promotion Cards:**
- Elevated cards with shadow-md, rounded-xl
- Header with status badge (active/scheduled/expired)
- Metrics row: impressions, claims, redemptions in 3-column grid
- Action buttons: Edit (outline), Pause/Activate (primary)
- Hover: lift effect with shadow-lg transition

**Analytics Dashboard:**
- KPI Cards: Large numbers with trend indicators (↑ ↓)
- Chart containers: white/dark surface with p-6
- Time range selector: Segmented button group
- Metric comparison: Side-by-side column layout

**Promotion Builder:**
- Multi-step form with progress indicator
- Rich text editor for description
- Image upload zone with drag-drop
- Audience targeting: Checkbox groups with icons
- Schedule picker: Calendar + time selection
- Preview pane: Live preview of worker-facing card

### Worker Experience Components

**Promotion Feed Cards:**
- Image-first design: 16:9 aspect ratio hero image
- Gradient overlay on image for text readability
- Restaurant logo badge in corner
- Bold offer headline: Poppins 600
- Distance/expiry metadata with icons
- CTA: "Claim Deal" button, full width
- Claimed state: Green checkmark badge, "Redeem" button

**Claim Flow:**
- Modal overlay with promotion details
- Terms acceptance checkbox
- "Confirm Claim" primary action
- Success: Immediate QR code generation
- Timer display for redemption window

**Redemption Interface:**
- Large QR code display (300x300px minimum)
- Unique code number below QR
- Restaurant details and location
- "Redeem Now" instruction
- Countdown timer if time-limited

### Navigation

**Restaurant Dashboard:**
- Sidebar navigation with icons (Heroicons)
- Active state: filled icon + accent border-left
- Sections: Dashboard, Promotions, Analytics, Settings
- Top bar: Restaurant selector dropdown + notifications

**Worker App:**
- Bottom tab navigation (4 tabs)
- Tabs: Feed, My Deals, Scan, Profile
- Active tab: Primary color fill + label
- Badge indicators for new offers

### Forms & Inputs

**Text Inputs:**
- Floating labels that shrink on focus
- Border-bottom style for minimal look OR full border for dashboard
- Focus: 2px accent border
- Error state: Red border + helper text below

**Buttons:**
- Primary: Solid fill, rounded-lg, px-6 py-3
- Outline: On images with backdrop-blur-sm bg-white/10
- Icon buttons: 40x40px touch target
- Loading state: Spinner + disabled opacity

### Overlays

**Modals:**
- Center overlay with backdrop-blur
- Max-width: 500px for mobile, 700px desktop
- Slide-up animation on mobile
- Close X in top-right corner

**Toast Notifications:**
- Bottom-center on mobile, top-right on desktop
- 4-second auto-dismiss
- Icon + message + optional action
- Success (green), Error (red), Info (blue)

---

## Images

### Hero Images

**Restaurant Landing:**
- Full-width hero: Restaurant staff celebrating/busy kitchen action
- Overlay gradient: from-transparent to-slate-900/60
- Height: 60vh on desktop, 50vh mobile
- Headline over image with backdrop-blur button

**Worker Landing:**
- Split hero: Left 50% image (workers enjoying food/drinks), Right 50% CTA
- OR full-width with central content overlay
- Images: Diverse service workers in casual, positive settings
- Height: 70vh

### Promotion Cards:
- Each promotion card MUST have a food/drink image
- Fallback: Restaurant exterior or branded graphic
- Aspect ratio: 16:9 for feed, 4:3 for dashboard thumbnails

### Profile/Trust Indicators:
- Restaurant logos: 80x80px circular avatars
- Verification badges: Small icon overlays

---

## Page-Specific Layouts

### Restaurant Dashboard Home:
- KPI row: 4 metric cards across (grid-cols-4)
- Active promotions section: 2-column grid
- Recent activity feed: Single column, right sidebar

### Worker Promotion Feed:
- Infinite scroll masonry grid
- Filter bar: Sticky top with category chips
- Empty state: Illustration + "No deals nearby" message

### Claim Success:
- Centered QR code
- Celebration micro-animation (confetti or checkmark pulse)
- Social share CTA below QR

---

## Animations

**Sparingly Used:**
- Claim button: Scale pulse on successful claim (once)
- Modal entry: Slide-up + fade-in (200ms)
- QR reveal: Fade-in scale (300ms)
- Loading skeletons: Subtle shimmer effect

**Avoid:**
- Continuous background animations
- Parallax scrolling
- Auto-playing carousels

---

## PWA-Specific Design

**Install Prompt:**
- Bottom sheet design with app preview
- "Add to Home Screen" primary action
- Benefits listed with icons
- Dismissible with "Not now" link

**Offline State:**
- Neutral gray banner: "You're offline"
- Cached promotions still viewable
- Sync icon when reconnecting

**Push Notification Design:**
- Icon: Restaurant logo or app icon
- Title: Restaurant name + offer headline
- Body: Brief offer detail + CTA text
- Action buttons: "View" or "Dismiss"

---

This design system creates a professional, trustworthy restaurant experience while delivering an exciting, appetite-driven worker interface. The use of vibrant food-centric colors for workers contrasts with the professional blue palette for restaurants, ensuring each audience gets the appropriate emotional response.