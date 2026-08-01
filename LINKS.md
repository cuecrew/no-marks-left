# Canonical campaign links

Every link pointing at this site from anywhere else **must** come from this file.

Two rules, both learned the hard way:

- **Lowercase always.** `Reddit` and `reddit` become two separate rows in PostHog and
  silently split your numbers in half.
- **Never tag internal links.** Only tag links that point *at* the site from
  elsewhere. UTMs on your own nav links corrupt attribution.

An untagged link is a channel you cannot evaluate. If it is not in this file, do not
post it.

Base URL: `https://edible-bookmarks.vercel.app/`

---

## Reddit

Book communities — the real target audience. Check each subreddit's self-promotion
rules before posting; most book subs remove store links.

| Where | Link |
|---|---|
| r/bookstan | `https://edible-bookmarks.vercel.app/?utm_source=reddit&utm_medium=social&utm_campaign=bookstan_aug26` |
| r/bookstan (in a comment, not the post body) | `https://edible-bookmarks.vercel.app/?utm_source=reddit&utm_medium=social&utm_campaign=bookstan_aug26&utm_content=comment` |
| r/romancebooks | `https://edible-bookmarks.vercel.app/?utm_source=reddit&utm_medium=social&utm_campaign=romancebooks_aug26` |
| r/IndianBooks | `https://edible-bookmarks.vercel.app/?utm_source=reddit&utm_medium=social&utm_campaign=indianbooks_aug26` |

Maker / startup subs. These convert badly because the audience is builders, not
readers — **tag them separately so they do not pollute the demand read.**

| Where | Link |
|---|---|
| r/SideProject | `https://edible-bookmarks.vercel.app/?utm_source=reddit&utm_medium=social&utm_campaign=sideproject_aug26` |
| r/IndianStartups | `https://edible-bookmarks.vercel.app/?utm_source=reddit&utm_medium=social&utm_campaign=indianstartups_aug26` |

## Instagram

| Where | Link |
|---|---|
| Bio link | `https://edible-bookmarks.vercel.app/?utm_source=instagram&utm_medium=social&utm_campaign=bio` |
| Story | `https://edible-bookmarks.vercel.app/?utm_source=instagram&utm_medium=social&utm_campaign=story_aug26` |

## Offline / partners

| Where | Link |
|---|---|
| Cubbon Reads QR card | `https://edible-bookmarks.vercel.app/?utm_source=cubbon_reads&utm_medium=qr&utm_campaign=pilot` |
| Bookstore insert card | `https://edible-bookmarks.vercel.app/?utm_source=bookstore&utm_medium=partner&utm_campaign=pilot` |

---

## Reading the results

In PostHog, take the intent funnel and break it down by **`$initial_utm_campaign`**
(not `utm_source` — every Reddit sub shares the same source, so source alone tells
you "Reddit worked" without telling you *which* community worked).

The number that matters is intent rate per campaign:

```
unique users with payment_attempted  ÷  unique users
```

Rough read: under 2% weak · 3–5% promising · above 5% real.

Expect maker subs to show high traffic and near-zero intent. That is not a failure of
the product, it is the wrong audience — which is exactly why they are tagged apart.
