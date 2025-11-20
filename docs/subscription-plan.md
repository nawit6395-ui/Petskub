# Subscription & Monetization Design

## Plan Matrix

| Plan | Price (THB / mo) | Target | Limits | Perks |
| --- | --- | --- | --- | --- |
| Free Care | 0 | Casual rescuers | 3 listings / month, 3 images each | Basic listing only |
| Home Booster | 199 | Active rescuers / shelters | 15 listings / month | Unlimited media, 1 featured slot, Verified badge |
| Rescue Pro | 499 | Shelters / NGOs | Unlimited listings | 3 featured slots, analytics export, profile page |
| Adopter Insights | 99 | Adopters | N/A | Saved filters, email alerts, 3 background-check requests |

## Core Concepts

1. **Plans** (`plans`): defines pricing, quota limits, perks metadata.
2. **Subscriptions** (`user_subscriptions`): current plan per user, start/end, status.
3. **Payment Transactions** (`payment_transactions`): PromptPay QR payments, slip URL, status (`pending`, `verified`, `rejected`).
4. **Plan Limits** (`plan_usage` view + cron) to keep track of posts created per cycle.
5. **Featured listings** (`featured_cats`) storing cat_id, slot, expiry.
6. **Adopter Alerts** (`adopter_alerts`) capturing saved filters + email notification preferences.
7. **Background Requests** (`background_requests`) linking adopter -> cat owner for manual approval.

## Flows

### Purchasing a plan
1. User selects plan + billing cycle (monthly for now).
2. We create `payment_transactions` row with amount and reference code.
3. Frontend renders PromptPay QR (from backend) and allows slip upload.
4. Admin verifies payment → updates transaction status to `verified`.
5. Trigger function activates/extends `user_subscriptions` and assigns perks (featured slots, badges).

### Posting cats with quota
- Before insert, call RPC `can_create_cat(user_id)` which checks remaining quota (plan limit - posts created this cycle).
- If insufficient, API returns error + remaining count for UI.
- On successful insert, `plan_usage` table increments monthly usage (via trigger or scheduled job that resets each month).

### Featured slots
- `featured_cats` maintains `cat_id`, `owner_id`, `plan_id`, `slot_number`, `featured_until`.
- Cron job clears expired slots.
- Homepage queries join to this table to show pinned cards first.

### Adopter email alerts
- `adopter_alerts` stores filters (JSONB) and `last_notified_at`.
- Edge Function `notify_adopters_on_new_cat` runs on `cats` insert; finds matching alerts and sends email via Supabase Functions/SMTP.

### Background checks
- `background_requests`: adopter, owner, cat, status, optional reference fields.
- Owners get email asking to approve/reject; once approved, adopter sees contact info.

## Security & Policies
- Plans and subscriptions readable by owners; modifications restricted to service role / admin.
- `payment_transactions` insertable by signed-in users; updates restricted to admins.
- `featured_cats` updates only by admins or automated functions verifying plan perks.
- `adopter_alerts` and `background_requests` limited to the owning users.

## Open Questions / Next Steps
- Need PromptPay QR generator service (could be Firebase function or separate endpoint) and slip storage bucket.
- Determine admin role list for approving payments.
- Decide how to handle partial months when upgrading/downgrading.
- Formalize email templates + provider (Resend, SendGrid, etc.).
