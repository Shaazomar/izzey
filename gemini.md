# Izzey clean & move — Project Context & Architecture

This file serves as the persistent context and architectural reference for the Izzey clean & move persistent development flow.

## 1. Core Identity & Architecture
- **Brand:** Izzey clean & move
- **Purpose:** Professional cleaning, advanced relocation logistics, and property management.
- **Tech Stack:** React 19, Vite, Tailwind CSS v3.4.17, GSAP 3 (with ScrollTrigger), Lenis Smooth Scroll, Lucide React icons.
- **Aesthetic:** Preset A — "Organic Tech" (Clinical Boutique)
  - Colors: Moss (`#2E4036`), Clay (`#CC5833`), Cream (`#F2F0E9`), Charcoal (`#1A1A1A`).
  - Typography: Plus Jakarta Sans / Outfit (Body/Headings), Cormorant Garamond (Drama), IBM Plex Mono (Data).
  - Visuals: Global `<feTurbulence>` noise overlay (opacity 0.05), massive contrast text, dark gradient overlays.

## 2. Component Structure
All components reside in `src/components/` and are stitched together in `App.jsx`.
1. **Navbar:** Floating pill-shaped nav that morphs its background on scroll (`.scrolled` class via ScrollTrigger).
2. **Hero:** Full-bleed background with massive declarative typography and staggering text reveal.
3. **Features:** Three bespoke functional widgets:
   - *Diagnostic Shuffler:* Recursively overlapping cards (Housing Logistics).
   - *Telemetry Typewriter:* Monospaced live terminal feed (Rental Management).
   - *Cursor Protocol Scheduler:* SVG cursor path animation (Equipment Dispatch).
4. **Philosophy:** Text contrast section with slow parallax background images.
5. **Protocol:** Sticky stacking cards sequence where earlier cards blur and scale down as new ones overlap.
6. **Booking:** Immersive split form capturing Name, Email, Phone, Services Required, Date, and Time. (Currently UI only).
7. **Footer:** Dark terminal anchor with a pulsing "System Operational" status indicator.

## 3. Current Development Status
- **Frontend / UI:** 100% Complete. The "digital instrument" feel is fully realized with GSAP animations and Lenis smooth scrolling.
- **Backend / Data Transport:** Pending. The booking form is currently a static frontend component (`onSubmit` prevents default). The next step is to wire this form to a data transport layer (e.g., EmailJS, Formspree, or a custom backend) to ensure the business owner receives the booking requests.
- **Pending Revisions:** User has noted "tiny modifications" to the UI to be executed step-by-step.
