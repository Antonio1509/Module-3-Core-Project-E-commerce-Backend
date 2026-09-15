# Fixes applied to LocalCart backend

Everything below was found by tracing every import, then actually booting
the server against a real MySQL database and exercising every route until
the logs were clean. Nothing here is theoretical — each fix was verified
live.

## Crashes on startup (fixed)

- `middleware/auth.js` — added `authenticate` (alias of `protect`) and
  `optionalAuth` exports; several route files imported these but they
  didn't exist.
- `controllers/userController.js` — `bcrypt` → `bcryptjs` (only
  `bcryptjs` was installed), and added the missing `pool` import used by
  `getAllUsers`.
- `package.json` — added `multer`, `nodemailer`, `twilio` (used in code,
  never declared). Also bumped `nodemailer` to `^10.0.10` — the version
  range originally implied by the code pulled in a release with several
  known high-severity advisories.
- Renamed three mistyped files so their imports resolve:
  `models/ickupPoints.js` → `models/PickupPoint.js`,
  `models/DeliveryMethods.js` → `models/DeliveryMethod.js`,
  `controllers/subsrciptionController.js` → `controllers/subscriptionController.js`.
- `controllers/vendorController.js` — fixed `../services/sms.js` →
  `../services/smsService.js`.
- `services/smsService.js` / `services/emailService.js` — both only had
  named exports, but were imported elsewhere as default imports
  (`import sms from ...`, `import emailService from ...`), which is a
  hard `SyntaxError` in ESM. Added default exports bundling the named
  functions. Also added the missing `sendVendorWelcomeSMS` /
  `sendVendorApprovedSMS` functions that `vendorController.js` called
  but didn't exist, and fixed an undefined `collectionCode` reference in
  `sendDeliveryUpdateSMS`.
- `routes/deliveryRoutes.js` — file was missing its `express` import and
  router setup entirely; rewritten.
- `routes/index.js` — now mounts `shipments`, `subscriptions`,
  `delivery`, and `analytics`, which existed as files but were never
  wired into `/api`.

## Missing feature (built)

- `controllers/analyticsController.js` + `routes/analyticsRoutes.js`
  were both empty files. Implemented three vendor-scoped endpoints in
  the same style as the existing `shipmentController`:
  - `GET /api/analytics/vendor/summary`
  - `GET /api/analytics/vendor/sales-over-time`
  - `GET /api/analytics/vendor/top-products`

  **This is a best-effort implementation** since there was no spec or
  frontend to match against — confirm the response shape against
  whatever dashboard consumes it, and adjust as needed.

## Data-integrity bugs (fixed)

- `controllers/productController.js` — `createProduct`, `updateProduct`,
  `deleteProduct`, and `getVendorProducts` were comparing/assigning
  against `req.user.id` (the `users` table id) instead of
  `req.user.vendor_id` (the `vendors` table id) — two different rows.
  This could silently create products under the wrong vendor, or block
  a vendor from editing their own products.
- `models/product.js` — `update()` did an **unconditional full-column
  UPDATE**, so editing just one field (e.g. price) nulled out every
  other field on the row. Rewritten to build the `SET` clause only from
  fields actually provided, matching the pattern already used in
  `vendorController.updateVendor`.
- `models/order.js` — `findByUser()`'s vendor-name subquery referenced
  a bare `vendor_name` column that doesn't exist (should be `v.name`
  after the `JOIN vendors v`) — this made `GET /api/orders/my` throw a
  500 every time. Fixed.
- `controllers/authController.js` — token generation read
  `process.env.JWT_EXPIRE`, but `.env` defines `JWT_EXPIRES_IN` — tokens
  were being issued with no expiry. Fixed to read the right variable
  (with a `7d` fallback).

## Security (fixed)

- `routes/vendorRoutes.js` had **no authentication at all** on
  `PATCH /:id/approve`, `PUT /:id`, and `POST /:id/products` — any
  unauthenticated request could approve a vendor, edit any store's
  profile, or add products to any store. Added `protect` middleware plus
  ownership checks inside `updateVendor`/`addProduct` so a vendor can
  only touch their own storefront.
  - `approveVendor` is now behind `protect`, but there's still no
    admin/role system in this schema — anyone with *any* account can
    call it today. You'll want a real `is_admin` flag before relying on
    this in production; see the comment left in `vendorRoutes.js`.

## Database schema (fixed/extended)

`database/LocalCart.sql` was missing tables and columns that the
existing code already queried against:

- Added tables: `delivery_methods`, `pickup_points`, `subscription_plans`,
  `vendor_subscriptions` — plus seed data for each.
- Added columns the code inserts into that weren't in the schema:
  - `orders.delivery_method`
  - `shipments.delivery_method`, `shipments.delivery_type`,
    `shipments.customer_name`, `shipments.destination`
  - `users.username`, `users.street`, `users.suburb`, `users.city`,
    `users.province`, `users.postal_code`, `users.gender`
    (all used by `authController.register()`)
  - `subscription_plans.tagline`, `subscription_plans.rankdrop_rate_note`,
    `subscription_plans.display_order`

All of the above were confirmed by actually installing MySQL, loading
this schema, and hitting every endpoint until every 500 was resolved —
not just by reading the code.

## What's still worth your attention

- **No PayFast ITN webhook** (`/api/payment/notify`) — `.env` points to
  it and PayFast will call it after a real payment, but nothing handles
  it, so orders never get marked as paid from the actual gateway
  callback. Not something I could safely guess the shape of without
  your PayFast integration details — worth building next.
- **No reviews feature** — `models/review.js` is still an empty stub
  and there's no `reviewRoutes.js`/`reviewController.js`. Left alone
  since there was nothing to fix and no spec to build from.
- **Rotate your PayFast sandbox credentials.** The merchant ID/key/
  passphrase in `.env` were included in your original zip upload —
  worth cycling them even though they're sandbox-only.
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `SMTP_HOST` etc. aren't
  set in `.env`, so vendor welcome/approval emails and SMS will fail
  silently (logged, not thrown) until you add real credentials. This is
  expected, not a bug — the app works fine without them, those
  notifications just won't send.
