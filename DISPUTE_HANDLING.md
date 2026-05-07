# Payment & Refund Dispute Handling

Scope: payment and refund disputes only (session payments, care-plan billing, refund delays, double charges, unauthorized charges). Tenant/landlord, verification, and account-data disputes are out of scope for this document.

This file is a single combined reference covering:
1. **User-facing policy** — what we publish and what users can rely on.
2. **Internal SOP** — how the team triages and resolves a dispute.
3. **Engineering spec** — the data model, hooks, and code paths involved.

Owner: TBD. Review cadence: every 6 months, or whenever cancellation/refund logic changes.

---

## 1. User-facing policy

### What counts as a payment dispute

- A charge the user does not recognize.
- A duplicate charge for the same session or care-plan cycle.
- A refund that has not arrived within the published window.
- A refund amount that does not match the cancellation window the user expected.
- A care-plan auto-renewal the user believes they had cancelled.
- A session marked completed when the user says it did not happen.

### How to file a dispute

Users can raise a dispute via:
- **Email:** support@neardear.in (TBD — confirm address)
- **SMS / WhatsApp:** the support number listed in their booking confirmation
- **In-app:** Help → Report a payment issue

We require, at minimum:
- The Razorpay payment ID **or** the session ID (both appear on the payment confirmation screen and email).
- A short description of the issue.
- Screenshots if the dispute is about a charge the user does not recognize.

### Refund timelines users can expect

Standard refund windows for **session cancellations** are already enforced in code (see [src/app/api/sessions/[id]/cancel/route.ts](src/app/api/sessions/[id]/cancel/route.ts)):

| Cancellation window | Refund to user | Companion compensation |
|---|---|---|
| More than 48 hours before | 100% | 0% |
| 24–48 hours before | 100% | 0% |
| Under 24 hours, different calendar day | 50% | 50% |
| Same calendar day | 0% | 80% (companion share) |
| After scheduled start | Not auto-cancellable — must be raised as a dispute | — |

Once a refund is initiated with Razorpay, the bank/UPI rail typically settles in **5–7 business days**. We do not control that window; if it is exceeded, raise a dispute and we will follow up with Razorpay on the user's behalf.

### What we commit to

- Acknowledge every dispute within **1 business day**.
- Resolve straightforward disputes (duplicate charge, missed refund) within **5 business days**.
- Resolve contested disputes (no-show, partial service, quality complaint) within **10 business days**, with a written explanation.
- Always log the outcome in the user's account history.

### What is *not* covered

- Disagreements about the quality of a session that did happen — those go through the feedback / rating flow, not the refund flow.
- Refund requests outside the windows above, except where required by law or where we judge there is a clear platform error.

---

## 2. Internal SOP

### Step 1 — Intake (any support channel)

Whoever picks up the dispute creates a record with:
- Session ID and/or Razorpay payment ID
- User ID
- Channel (email / SMS / in-app)
- Free-text description
- One-line category (see categories below)

Categories (use exactly these strings — they map to `cancelReasonCategory` on `CancellationRecord` where applicable):
- `UNRECOGNIZED_CHARGE`
- `DUPLICATE_CHARGE`
- `REFUND_DELAYED`
- `REFUND_AMOUNT_DISPUTED`
- `CARE_PLAN_AUTORENEW`
- `SESSION_NO_SHOW`
- `OTHER`

### Step 2 — Verify state in the database

Before replying, run these checks. Each maps to a real model:

1. **Pull the payment record.** `Payment` is keyed on `sessionId` (one payment per session). Confirm:
   - `status` (`PENDING` / `CAPTURED` / `REFUNDED` / `PARTIALLY_REFUNDED` / `FAILED`)
   - `razorpayPaymentId`, `razorpayOrderId`, `razorpayRefundId`
   - `refundAmount` and `partialRefundAmount`
   - `refundedAt` and `partialRefundedAt`
2. **Pull any cancellation record.** `CancellationRecord` is the audit row for every cancel attempt (see fields written in [src/app/api/sessions/[id]/cancel/route.ts](src/app/api/sessions/[id]/cancel/route.ts#L242-L260)). It records the window, the original amount, the calculated refund, and `refundStatus` (`PENDING` / `PROCESSING` / `NA`).
3. **Pull the financial audit log.** `FinancialAuditLog` has the before/after values for every status change (see [src/app/api/sessions/[id]/cancel/route.ts](src/app/api/sessions/[id]/cancel/route.ts#L263-L280)). This is the primary "what actually happened, when, by whom" trail.
4. **Cross-check against Razorpay.** Use the Razorpay dashboard (or `razorpay.payments.fetch(id)` / `razorpay.payments.fetchRefund(...)`) for the canonical view. The DB can lag a webhook; Razorpay does not.

### Step 3 — Decide

Use this decision tree:

- **Razorpay says the charge does not exist** → it is a phishing / wrong-merchant claim. Tell the user, do not refund anything from us.
- **Razorpay shows the charge, our DB does not** → webhook gap. File an engineering bug, refund through Razorpay manually, then reconcile.
- **Both show the charge and a `refundedAt` timestamp older than 7 business days** → escalate to Razorpay support; user is right to be frustrated.
- **Charge captured, no cancellation, user claims no-show** → check `Session.status` and any `checkin` record. If the companion didn't check in, issue a manual full refund and cancel the corresponding `Earning`.
- **Care-plan auto-renewal disputed** → check the cron run in [src/app/api/cron/care-plan-billing/route.ts](src/app/api/cron/care-plan-billing/route.ts) and the user's care plan status at the time of charge. If the plan was active and not paused, the charge stands; if not, refund.
- **Refund amount disputed** → walk the user through the window table above and the timestamp on `Session.scheduledDate` / `scheduledTime`. The math is in `computeAmounts` at [src/app/api/sessions/[id]/cancel/route.ts](src/app/api/sessions/[id]/cancel/route.ts#L50-L79).

### Step 4 — Execute

For each outcome, the steps differ:

- **No refund owed:** reply to the user with the calculation and a link to this policy. No DB changes.
- **Auto-refund already in flight:** reply with the `razorpayRefundId` and the expected settlement date. No DB changes.
- **Manual refund needed (post-session, no-show, webhook gap, goodwill):**
  1. Initiate the refund in the Razorpay dashboard (or via a one-off script using `razorpay.payments.refund`).
  2. Update `Payment.status`, `refundAmount`, `refundReason`, `razorpayRefundId`, `refundedAt` to mirror what Razorpay returns.
  3. If the companion had a `PENDING` `Earning` for this session, set `Earning.status = CANCELLED` (or reduce the amount, mirroring the same-day vs. <24h logic).
  4. Write a `FinancialAuditLog` row with `action = 'STATUS_CHANGED'`, `actorType = 'ADMIN'`, and a `note` that names the dispute and the support agent.
  5. Write a `CancellationRecord` if one does not already exist, with the manual override values.

**Never** edit `Payment` or `Earning` in the DB without writing the matching `FinancialAuditLog` row. The audit log is the only thing that lets us defend a decision later.

### Step 5 — Communicate and close

- Reply to the user on the same channel they raised the dispute on.
- Include: the Razorpay payment ID, the refund (if any) and its expected settlement date, and a one-line reason for the decision.
- Close the dispute record with the outcome.

### Escalation

- **Engineering** if there is a webhook gap, an amount mismatch between Razorpay and our DB, or a suspected double-charge bug.
- **Founder/owner** for any decision over ₹10,000, any goodwill refund, or any case where the user has threatened a chargeback.
- **Razorpay support** for refunds stuck longer than 7 business days after `refundedAt`.

---

## 3. Engineering spec

### Existing surfaces

| Concern | File |
|---|---|
| Create Razorpay order | [src/app/api/payments/create-order/route.ts](src/app/api/payments/create-order/route.ts) |
| Cancel + auto-refund | [src/app/api/sessions/[id]/cancel/route.ts](src/app/api/sessions/[id]/cancel/route.ts) |
| Session checkout | [src/app/api/sessions/[id]/checkout/route.ts](src/app/api/sessions/[id]/checkout/route.ts) |
| Care-plan payment | [src/app/api/care-plans/[id]/payment/route.ts](src/app/api/care-plans/[id]/payment/route.ts) |
| Care-plan billing cron | [src/app/api/cron/care-plan-billing/route.ts](src/app/api/cron/care-plan-billing/route.ts) |
| Earnings split | [src/lib/earnings.ts](src/lib/earnings.ts) |

### Models that disputes touch

- `Payment` — one per session, holds Razorpay IDs and refund fields.
- `CancellationRecord` — audit row per cancel attempt, with the chosen `CancellationWindow` and computed amounts.
- `FinancialAuditLog` — append-only row for every money-affecting change. **Always write one.**
- `Earning` — companion's pending payout. Refunds may cancel or reduce it.
- `Session` — the booking itself; carries `status`, `scheduledDate`, `scheduledTime`.

### Things we do not yet have (gaps to close)

These come up repeatedly when handling disputes and are worth tracking as separate engineering tickets:

1. **No `Dispute` model.** Today, disputes live in email threads and ad-hoc notes. A small Prisma model (`Dispute { id, userId, sessionId?, paymentId?, category, status, openedAt, resolvedAt, outcome, note }`) plus an admin view would replace the spreadsheet.
2. **No Razorpay webhook handler.** All payment/refund state changes are written from the same request that initiates them. If Razorpay's response is delayed or fails after the user closes the page, the DB can be out of sync. A `/api/webhooks/razorpay` route that handles `payment.captured`, `refund.processed`, and `refund.failed` would close that gap.
3. **No reconciliation job.** A nightly cron that compares Razorpay's payments/refunds list against `Payment` rows and flags mismatches would catch silent webhook gaps before users report them.
4. **POST_SESSION refunds have no UI.** [src/app/api/sessions/[id]/cancel/route.ts](src/app/api/sessions/[id]/cancel/route.ts#L159-L161) refuses post-session cancels with "Contact support". An admin-only refund endpoint would let support resolve no-show disputes without using the Razorpay dashboard.
5. **No idempotency on manual refunds.** When implementing the admin endpoint above, key it by `razorpayPaymentId + amount` so retries don't double-refund.

### Invariants any dispute-related code must preserve

- One `Payment` per `Session` (`sessionId` is unique on `Payment`). Do not create a second row to model a refund — update the existing one and log to `FinancialAuditLog`.
- Total of `refundAmount + companionComp + platformRetained` must equal `originalAmount` on every `CancellationRecord`. The cancel handler enforces this; manual paths must too.
- `Earning.status` transitions: `PENDING → PAID` or `PENDING → CANCELLED`. Never edit a `PAID` earning to fix a dispute — issue a separate adjustment.
- Every money-affecting change writes a `FinancialAuditLog` with the actor and a human-readable `note`.

---

## Changelog

- 2026-05-07 — Initial draft. Policy, SOP, and engineering notes scoped to payment/refund disputes.
