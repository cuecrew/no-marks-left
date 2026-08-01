# Canonical campaign links

Every link pointing at this site from anywhere else **must** be copied from this
file. If it is not in here, do not post it.

Three rules, all of which cost real data when broken:

- **Lowercase always.** `Reddit` and `reddit` become two separate rows in PostHog and
  split one channel's numbers in half.
- **Never tag internal links.** Only tag links that point *at* the site from
  somewhere else. UTMs on your own nav links corrupt attribution.
- **An untagged link is a channel you cannot evaluate.** It lands as `$direct` and
  becomes unattributable forever.

Base URL: `https://edible-bookmarks.vercel.app/`

## The scheme

| Param | Means | Values in use |
|---|---|---|
| `utm_source` | The platform | `instagram` · `reddit` · `discord` · `whatsapp` · `goodreads` · `print` |
| `utm_medium` | How it behaves, so like-for-like groups together | `social` (public, algorithmic) · `messaging` (direct, high-trust) · `cpc` (paid) · `qr` (offline) |
| `utm_campaign` | Which wave | `launch_aug26` |
| `utm_content` | The specific placement inside that channel | `bookstan` · `bio` · `story` · … |

Campaign is the **wave**, content is the **placement**. That way you can read
performance by channel *and* by individual placement without inventing a new campaign
name every time you post.

---

## 1. Instagram

```
https://edible-bookmarks.vercel.app/?utm_source=instagram&utm_medium=social&utm_campaign=launch_aug26&utm_content=bio
```
```
https://edible-bookmarks.vercel.app/?utm_source=instagram&utm_medium=social&utm_campaign=launch_aug26&utm_content=story
```
```
https://edible-bookmarks.vercel.app/?utm_source=instagram&utm_medium=social&utm_campaign=launch_aug26&utm_content=reel
```

## 2. Reddit

Swap `utm_content` for whichever subreddit. Check each sub's self-promotion rules
first — most book subs remove store links.

```
https://edible-bookmarks.vercel.app/?utm_source=reddit&utm_medium=social&utm_campaign=launch_aug26&utm_content=bookstan
```
```
https://edible-bookmarks.vercel.app/?utm_source=reddit&utm_medium=social&utm_campaign=launch_aug26&utm_content=romancebooks
```
```
https://edible-bookmarks.vercel.app/?utm_source=reddit&utm_medium=social&utm_campaign=launch_aug26&utm_content=indianbooks
```

Maker/startup subs — high traffic, near-zero intent, because the audience is builders
not readers. Tagged apart so they do not dilute the demand read.

```
https://edible-bookmarks.vercel.app/?utm_source=reddit&utm_medium=social&utm_campaign=launch_aug26&utm_content=sideproject
```

## 3. Discord

```
https://edible-bookmarks.vercel.app/?utm_source=discord&utm_medium=messaging&utm_campaign=launch_aug26
```

Per-server, so you can tell which community actually responded:

```
https://edible-bookmarks.vercel.app/?utm_source=discord&utm_medium=messaging&utm_campaign=launch_aug26&utm_content=<server_name>
```

## 4. WhatsApp

```
https://edible-bookmarks.vercel.app/?utm_source=whatsapp&utm_medium=messaging&utm_campaign=launch_aug26
```

Split broadcast from one-to-one — they convert very differently:

```
https://edible-bookmarks.vercel.app/?utm_source=whatsapp&utm_medium=messaging&utm_campaign=launch_aug26&utm_content=group
```
```
https://edible-bookmarks.vercel.app/?utm_source=whatsapp&utm_medium=messaging&utm_campaign=launch_aug26&utm_content=dm
```

**Caveat:** WhatsApp strips referrer data, so without these tags the traffic is
completely invisible. Tagging matters more here than anywhere else.

## 5. Goodreads (paid)

```
https://edible-bookmarks.vercel.app/?utm_source=goodreads&utm_medium=cpc&utm_campaign=launch_aug26
```

`utm_medium=cpc` marks this as paid so it never gets averaged in with organic.

**Verify the product still exists before planning around it** — I believe Goodreads
retired its self-serve advertising platform, and authors were pushed to Amazon Ads
instead. If so, use:

```
https://edible-bookmarks.vercel.app/?utm_source=amazon_ads&utm_medium=cpc&utm_campaign=launch_aug26
```

Either way: do not spend on this until organic has produced an intent rate. Paid
without a known conversion rate is spending blind.

## 6. Physical / print (QR codes)

```
https://edible-bookmarks.vercel.app/?utm_source=print&utm_medium=qr&utm_campaign=launch_aug26&utm_content=cubbon_reads
```
```
https://edible-bookmarks.vercel.app/?utm_source=print&utm_medium=qr&utm_campaign=launch_aug26&utm_content=bookstore_card
```
```
https://edible-bookmarks.vercel.app/?utm_source=print&utm_medium=qr&utm_campaign=launch_aug26&utm_content=litfest
```

**Two things about printed QR codes:**

1. **Long URLs make dense, hard-to-scan codes.** Test any code you print from ~30cm
   away, on a cheap phone, in bad light, before ordering a batch.
2. **You cannot change a printed code.** Consider pointing it at a short path you
   control that redirects with the UTMs attached — then the destination stays editable
   after the cards are printed.

---

## Reading the results

In PostHog, take the intent funnel and break it down by:

- **`$initial_utm_source`** → which platform works
- **`$initial_utm_content`** → which specific placement or community works
- **`$initial_utm_medium`** → whether `social`, `messaging`, `cpc` or `qr` behaves better as a class

North star per segment:

```
unique users with payment_attempted  ÷  unique users
```

Rough read: under 2% weak · 3–5% promising · above 5% real.

Expect `messaging` (Discord, WhatsApp) to show **low volume but high intent** — those
arrive with a personal recommendation attached. Expect maker subs to be the inverse.
Judge each channel on intent rate, never on traffic.
