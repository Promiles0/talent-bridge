
# Phase 15 — Trust, Hire & Grow

Combines all four next-phase options into one cohesive arc, sequenced so each batch builds on the previous. Trust ships first (it unlocks everything else), then the live hiring pipeline, then the university portal, then monetization on top.

---

## Batch 1 — Verified Trust Layer

The foundation. Without verification, reviews and paid tiers are worthless.

**Database**
- `verifications` — `id, user_id, kind (student|company), method (email_domain|id_upload|rdb), evidence_url, status (pending|approved|rejected), reviewer_id, reviewed_at, notes`
- `reviews` — `id, application_id, author_id, subject_id, role (student|employer), rating (1-5), comment, created_at` (one per application per direction)
- Extend `students` with `verified boolean`, `verified_at`. Extend `companies` already has `verified`.
- `university_domains` seed table (`@ur.ac.rw`, `@aub.rw`, `@ines.ac.rw`, etc.) for auto-verification.
- View `reputation_scores` aggregating average rating + count per user.

**UI**
- Student: "Get verified" card on profile → choose email-domain check (sends OTP to academic email) or ID upload to `cvs` bucket subfolder.
- Employer: Verification tab in Branding Studio → RDB number + business email + logo proof.
- Admin: `/dashboard/admin/verifications` queue with approve/reject + reason.
- "Verified" badge component used on student cards, company pages, internship listings, message threads.
- Internship board + Talent Search: "Verified only" filter (default ON for employers viewing students).
- Post-completion review prompt (modal triggered when application status = `completed`).

**Edge functions**
- `verify-academic-email` — sends + validates OTP.
- `verify-company` — light RDB lookup placeholder (manual admin step for now).

---

## Batch 2 — Interview & Offer Pipeline

Turns "shortlisted" into actual hires.

**Database**
- Extend `interview_slots` (already exists) with `student_response (pending|accepted|declined)`, `reschedule_reason`.
- `offers` — `id, application_id, employer_id, student_id, start_date, end_date, stipend, terms, pdf_url, status (sent|accepted|declined|withdrawn), signed_at, signature_data jsonb`
- `onboarding_tasks` — `id, offer_id, title, due_date, status, assignee`

**UI**
- Employer Applications: "Schedule interview" → proposes 3 slots → student picks one from a beautiful slot picker. Auto-creates `calendar_events` for both sides + email + notification.
- Video room route `/interview/:slotId` using Daily.co iframe (BYO key via secret) with a side panel that:
  - Shows the student's profile & CV for employer.
  - Shows AI live-coaching tips for student (uses existing `ai-career-chat` with interview context).
- Offer letter builder in employer dashboard: rich template → generates PDF (jsPDF) → stored in new `offers` storage bucket → student signs with typed/drawn signature → status flips to `accepted` → onboarding checklist auto-created.
- Student Offers page `/dashboard/student/offers` with sign/decline flow.

**Edge functions**
- `interview-scheduler` — proposes slots, validates conflicts.
- `offer-pdf-generate` — server-side PDF rendering.

---

## Batch 3 — University Partner Portal

New role unlocks B2B credibility and is the wedge for monetization.

**Database**
- New enum value: `app_role = ... | 'university'`.
- `universities` — `id, name, slug, domain, logo_url, hero_image_url, about, contact_email, verified`
- `university_members` — `university_id, user_id, role (admin|staff)`
- `university_endorsements` — `university_id, student_id, note, created_at`
- Link students to universities via existing `students.university` text plus a new optional `university_id`.

**UI**
- New sidebar `UniversitySidebar.tsx` and dashboard at `/dashboard/university/*`:
  - Overview: placement rate, top employers hiring our students, skill-gap heatmap by program, monthly active students.
  - Students roster (filter, bulk-invite via CSV, endorse).
  - Internships curated for our students (boost / pin to top of `/universities/:slug` page).
  - Branding (logo, cover, story) → renders public co-branded landing `/universities/:slug`.
- Signup flow: add "University" as a 4th role option, gated by admin approval initially.
- Cross-link: student profiles show "Endorsed by University of Rwanda" badge.

---

## Batch 4 — Monetization & Plans

Lands last, on top of verified employers + active hiring.

**Integration**
- Lovable's built-in Stripe payments (`enable_stripe_payments`).
- Three employer tiers: **Free** (1 active internship, no AI talent search), **Pro** (unlimited internships, AI talent search, branding studio, shortlists), **Enterprise** (analytics export, priority support, university partnerships).
- One university tier: **Partner** (annual subscription, unlocks full portal + co-branded page).

**Database**
- `subscriptions` mirror table (`user_id, tier, status, current_period_end, stripe_customer_id, stripe_subscription_id`).
- `feature_flags` helper function `has_feature(_user_id, _feature_key)` used by RLS + UI gating.
- Boost product: `featured_internships` (one-off purchase, internship pinned for 7 days).

**UI**
- `/pricing` public page (3 tiers + university tier).
- `/dashboard/<role>/billing` — current plan, invoices, upgrade/downgrade.
- Upgrade prompts on locked features (AI Talent Search empty state, Branding Studio editor, etc.).
- Admin: revenue dashboard tile in `AdminOverview`.

**Edge functions**
- `stripe-checkout`, `stripe-customer-portal`, `stripe-webhook` (auto-generated by Lovable payments).

---

## Technical Notes

- Each batch is independently shippable; user can pause between any two.
- Reuses existing infra: notifications, calendar, audit log, edge function patterns, BentoCard, AuroraBackground.
- All new tables get RLS following the existing `has_role` + ownership patterns.
- Email sending for OTP / interview invites / offers will use a new `RESEND_API_KEY` secret (will request when Batch 1 starts).
- Daily.co for video rooms needs `DAILY_API_KEY` (request at Batch 2).
- Stripe enabled via Lovable's built-in flow at Batch 4 (no secret to request).

---

## Execution order

```text
Batch 1  Trust       → ~3-4 turns
Batch 2  Hire        → ~3-4 turns
Batch 3  University  → ~3 turns
Batch 4  Monetize    → ~2-3 turns
```

Reply **approve** to start with Batch 1 (Verified Trust Layer), or tell me to reorder / drop any batch.
