# No Marks Left — a fakedoor demand test

Edible chocolate bookmarks for people who finish books at 3am. You read the book,
then you eat the bookmark.

**The product does not exist.** This site is a fakedoor: a real-looking storefront
built to measure whether anyone would actually pay, before a single rupee goes into
inventory, moulds, or an FSSAI licence. Checkout deliberately fails at the payment
step and converts the disappointment into a waitlist signup.

**Live:** [edible-bookmarks.vercel.app](https://edible-bookmarks.vercel.app)

---

## Why build it this way

The interesting problem here is not the site. It is that **you only get one clean
shot at a first-impression demand test on a given audience.** You cannot re-run it
on the same people once they have seen it. So the measurement design has to be
right before any traffic arrives — which turned out to be most of the work.

The hypothesis being tested is narrow and falsifiable:

> Enough people in the Indian BookTok / Bookstagram audience will attempt to pay
> for an edible bookmark that it justifies producing a first small batch.

The metric that answers it is `payment_attempted` per unique visitor. Everything
else on this site is either a leading indicator of that number or a diagnostic for
why it is low.

---

## Stack

Deliberately boring. No framework, no build step, no dependencies.

| | |
|---|---|
| Frontend | Static HTML + CSS + vanilla JS |
| State | `localStorage` (cart) |
| Analytics | PostHog (loaded directly, no npm) |
| Email capture | Formspree |
| Hosting | Vercel |

Eight static pages. The whole thing deploys with `vercel --prod` and has no
package.json. For a throwaway experiment that has to be *correct* rather than
*scalable*, a build pipeline would have been pure overhead.

```
index.html      home — hero, gift box, product grid
product.html    product detail, driven by ?id= query param
cart.html       cart, free-shipping progress, cross-sell
checkout.html   the fakedoor — payment method selection → failure → waitlist
about.html      brand story
privacy.html / terms.html / refunds.html    policy pages
analytics.js    event layer (see below)
interactions.js chocolate-snap sound, shatter particles, badge bounce
legal.css       shared styling for the policy pages
```

---

## The measurement design

This is the part worth reading.

### One canonical funnel event

The first version had **three different event names for the same funnel step** —
`quick_add_to_cart` from the grid, `add_to_cart` from the product page, and
`cross_sell_added` from the cart. That silently breaks everything downstream: no
single funnel can span three names, so every conversion rate computed from it would
have been wrong.

Fixed by collapsing to one `add_to_cart` event where the surface is a *property*:

```js
nml.track('add_to_cart', {
  source: 'grid' | 'product_page' | 'cart_cross_sell' | 'gift_box_banner',
  sku_type: 'flavour_pack' | 'gift_box',
  product_id, product_name, price, pack_size, qty,
  availability: 'in_stock' | 'coming_soon',
  cart_value
});
```

**Rule of thumb: if two things are the same step in the funnel, they are the same
event with different properties. Never different event names.**

### The funnel spine

```
$pageview → product_viewed → add_to_cart → checkout_started → payment_attempted → waitlist_email_submitted
```

`$pageview` is fired manually under its real PostHog name rather than a custom
`page_view`, so PostHog's native Web Analytics (paths, bounce rate, session
duration) keeps working while still carrying page-scoped properties.

### Impressions, so rates have honest denominators

Without impression tracking, "2% of visitors added the gift box" is uninterpretable
— you cannot tell *never saw it* from *saw it and said no*. Those imply opposite
fixes: one is placement, the other is the offer.

Every section and CTA fires `section_viewed` via `IntersectionObserver` at 50%
visibility, once per page view. Each product card fires `product_impression`.

### Demand for things that do not exist yet

Only 3 of 6 flavours have photography. The other 3 render a "coming soon" state —
and clicking one is **pure demand for a product that cannot be made yet**, which is
the single best signal for what to produce next. So it is tagged separately
(`coming_soon_clicked`, `coming_soon_viewed`) instead of being pooled with in-stock
clicks.

Those pages also swap add-to-cart for an email capture (`notify_me_submitted`,
carrying `waitlist_flavour`). Before that, half the catalogue was a dead end and
generated no measurable demand at all.

### Attribution

`person_profiles: 'always'`. On the default (`identified_only`), anonymous visitors
get no person profile and therefore **no UTM attribution** — and since ~97% of
fakedoor traffic never submits an email, channel analysis would have been
impossible. First-touch `$initial_utm_*` is set once and never overwritten, so a
visitor who arrives from Reddit, leaves, and converts three days later via Google
is still credited to Reddit.

### Cohort versioning

Every event carries `pricing_version`. Prices changed mid-build (₹299 → ₹349);
without a version stamp, pre- and post-change events would pool into one
meaningless average. Bump the version, filter cleanly.

### Person-level funnel stage

A monotonic ladder persisted in `localStorage` and mirrored to a person property.
It only ever ratchets upward, which makes cohorts trivial to build:

```
landed → viewed_product → added_to_cart → checkout_started → payment_attempted → waitlisted
```

### On instrumenting "every button"

Deliberately **not** hand-coded. PostHog `autocapture` records every click
automatically, plus rage clicks and dead clicks. Named events exist only where they
are needed in a funnel or metric.

Hand-writing 40 click events would create noise, drift out of date, and break on
every redesign. Autocapture is the exploratory safety net; named events are the
dataset.

### Full event list

**Funnel:** `$pageview` · `product_viewed` · `add_to_cart` · `checkout_started` ·
`payment_attempted` · `waitlist_email_submitted`

**Intent / diagnostics:** `product_clicked` · `product_impression` ·
`section_viewed` · `coming_soon_clicked` · `coming_soon_viewed` ·
`notify_me_shown` · `notify_me_submitted` · `pack_size_selected` · `qty_changed` ·
`cart_qty_changed` · `cart_item_removed` · `payment_method_selected` ·
`checkout_step_completed` · `checkout_payment_reached` · `checkout_abandoned` ·
`fake_door_shown` · `scroll_depth` (25/50/75/100) · `hero_cta_click` ·
`about_cta_click` · `nav_click` · `footer_link_click` · `outbound_click` ·
`email_signup`

**Person properties:** `max_funnel_stage` · `has_attempted_payment` ·
`is_waitlisted` · `intent_cart_value` · `intent_sku_types` ·
`intent_payment_method` · `preferred_sku_type` · `preferred_payment_method` ·
`viewed_coming_soon` · `waitlist_flavour` · plus PostHog's automatic
`$initial_utm_*`, `$initial_referrer`, device, browser and geo.

### Reading it

| Metric | Definition | Rough read |
|---|---|---|
| **Intent rate** (north star) | unique `payment_attempted` ÷ unique visitors | <2% weak · 3–5% promising · >5% real |
| Waitlist capture | `waitlist_email_submitted` ÷ `payment_attempted` | 20–40% healthy |
| SKU mix | `add_to_cart` broken down by `sku_type` | tests the gifting hypothesis |
| Flavour demand | `coming_soon_clicked` + `notify_me_submitted` by `product_name` | decides what to make next |

At ~1,000 visitors and a 3% intent rate you have **~30 conversions**. That is
enough for one dimension of breakdown, not three. Slicing by device *and* channel
*and* SKU at that volume is reading noise.

---

## Pricing: why there is no A/B test

The obvious move is to A/B the price. The arithmetic says don't.

Detecting whether ₹399 converts worse than ₹299 — say 2% vs 3% — needs roughly
**3,000–4,000 visitors per arm**. Three arms is ~9,000 visitors. Phase 1 organic
traffic is planned at ~1,000 *total*. The test would return a number that looked
like a result and was actually noise, which is worse than not testing.

Instead the site presents two SKUs simultaneously — a ₹349–399 flavour 4-pack and a
₹799 gift box — and measures **which one people choose**. Because every visitor sees
both and self-selects, that is revealed preference rather than a controlled
experiment, and it needs a fraction of the sample to be informative. It also tests
the more important strategic question: is this a gifting product or a self-buy
product?

---

## Engineering notes

A few things that were more interesting than expected.

### The PostHog snippet was broken in two independent ways

Events were not arriving. The bundled bootstrap snippet turned out to be a stale
variant with two separate faults:

1. It built the SDK asset URL as `https://us-assets.us/static/array.js` —
   a hostname that does not resolve. Fixed the host rewrite.
2. Its stub method list contained `posthog.toString`. The helper that expands
   dotted names did `t = t['posthog']` (undefined) then assigned to it →
   `TypeError`. The injected `<script>` tag came *before* that loop, so `array.js`
   downloaded fine and the network log looked healthy — but
   `_i.push([token, config])` never ran, so when the real SDK arrived there was no
   queued `init()` to replay. It sat with `token: ""` and `__loaded: false`,
   silently sending nothing.

The `try/catch` around `posthog.init()` swallowed the TypeError, so there was no
console error either. Silent on every channel. The giveaway was `token: ""` — that
revealed the config was defaults rather than mine.

Replaced the minified snippet with an explicit loader: append the script, `init()`
in `onload`, and buffer `nml.track()` calls in a local queue until ready so nothing
fired during page load is lost.

### Unquoted string values, three times

`posthog.init(phc_abc…)` and `const FORMSPREE_ID = https://formspree.io/f/xyz;` were
both pasted without quotes. The first threw inside a `try/catch` and failed
silently. The second was worse — a `SyntaxError` in an inline `<script>` prevents
the **whole block** from parsing, so nothing on the checkout page ran at all: no
order summary, no `placeOrder`, no fake door. `node --check` on the extracted
script block catches this instantly and is now part of the pre-deploy check.

### Photos vs. a CSS die-cut shape

Product mockups were forced through a CSS `clip-path` bookmark silhouette designed
for flat colour placeholders. Real photos letterboxed against it and the card
gradient showed through as coloured bands. Fixed by pre-cropping every photo to
exactly 3:4 and switching to `object-fit: cover`, so frame aspect and image aspect
match at 0.750 and nothing is cropped or padded. The synthetic "coming soon"
placeholders keep the clipped silhouette, since there is no photo to distort.

### Chocolate snap, synthesised

`interactions.js` generates the add-to-cart snap with the Web Audio API rather than
shipping an audio file — two layers of filtered noise, a bandpass mid-crack at
950Hz and a lowpass body at 280Hz. Plus shatter particles and a cart-badge bounce.

---

## Legal and ethical groundwork

A fakedoor collects real emails from real people, so the compliance work is not
optional. Notable decisions:

- **Removed a fake "FSSAI Certified" badge.** Claiming a food-safety licence you do
  not hold is an offence under the FSS Act 2006 regardless of whether any order is
  ever fulfilled. Deleted from the markup rather than hidden with CSS, since
  `display:none` leaves the claim in the page source where crawlers still read it.
- **Removed all card fields.** Collecting a card number, expiry and CVV in a form
  that can never charge anyone reads as a phishing pattern and risks ad-account
  suspension. Checkout now shows five selectable payment methods (UPI, card, net
  banking, wallet, COD) — which is what real Indian checkouts show first anyway —
  and no card field exists anywhere on the site. This *added* signal:
  `payment_method_selected` reveals whether the audience is UPI-first or COD-first.
- **`session_recording.maskAllInputs: true`.** The privacy policy promises nothing
  typed into a field is visible in a replay, so it has to actually be true.
- **Privacy, Terms and Shipping/Refunds pages**, linked from every footer plus a
  consent line above the pay button. Written to describe what this site genuinely
  does — the real processors, real retention periods, DPDP Act 2023 rights.
- **Terms state the pre-launch status explicitly**: adding to cart or submitting
  checkout creates no binding contract, and a sale concludes only on emailed
  confirmation. That is what makes the failed payment a disclosed condition rather
  than a deception.

### Still open

- The testimonials are illustrative, not real customer reviews, and should be
  removed or relabelled before any paid traffic.
- `vijan.cuecrew@gmail.com` is not yet a live inbox.

---

## Running it locally

No build step. Any static server:

```bash
python3 -m http.server 3456
# → http://localhost:3456
```

Before deploying, syntax-check the inline scripts — this catches the class of bug
described above:

```bash
node --check analytics.js
node --check interactions.js
```

### Configuration

Both of these are client-side public identifiers, not secrets. PostHog project keys
are designed to ship in browser JS.

| Where | What |
|---|---|
| `analytics.js` → `PROJECT_KEY` | PostHog project API key |
| `checkout.html` / `product.html` → `FORMSPREE_ID` | Formspree form id |

Cache-busting is manual: bump `?v=N` on the `analytics.js` / `interactions.js`
script tags across all pages after editing either file.

---

## What I would do differently

- **Instrument before styling.** Most of the analytics work was retrofitting a
  taxonomy onto pages already built, which is how the three-names-for-one-step
  problem happened in the first place. The event spec should have been written
  before the first page.
- **Version the price from day one.** `pricing_version` was added after prices had
  already changed, so the earliest events are not cleanly comparable.
- **Verify the analytics path end to end before anything else.** The site looked
  finished and deployed for days while collecting exactly zero events.
- **Sanity-check the sample size before designing a test.** The price A/B was
  planned and then abandoned once the arithmetic was actually done — that should
  have been the first calculation, not the last.

---

## Status

Instrumentation complete and verified end to end. Not yet driven traffic. Next step
is a small physical pilot batch to generate real photography and real reviews,
followed by organic seeding in Indian book communities during the Oct–Feb window,
when gifting demand peaks and chocolate survives Indian shipping temperatures.

*Built as a product/analytics exercise. The measurement design is the point; the
chocolate is hypothetical.*
