# SEO & Analytics Setup — Guru Sishya

## Domain: www.guru-sishya.in

---

## 1. SPF Record (DNS)

Add a TXT record to your domain's DNS:

```
Type:    TXT
Host:    @
Value:   v=spf1 include:_spf.google.com ~all
TTL:     3600
```

If you use Zoho Mail or another transactional mail provider, add their SPF include as well.

---

## 2. Google Search Console

1. Go to https://search.google.com/search-console/
2. Click "Add Property" → Domain property → enter `guru-sishya.in`
3. Verify via DNS TXT record (add the provided value as a TXT record at `@`)
4. Once verified, submit the sitemap: `https://www.guru-sishya.in/sitemap.xml`
5. Request indexing for the homepage via URL Inspection tool

---

## 3. GA4 Setup

1. Go to https://analytics.google.com/ → Create Account → Create Property
2. Set up a Web data stream for `https://www.guru-sishya.in`
3. Copy the Measurement ID (format: `G-XXXXXXXXXX`)
4. Add to your environment: `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`
   - Development: `.env.local`
   - Production: Vercel / hosting dashboard environment variables

GA4 is conditionally loaded in `src/app/layout.tsx` — it only fires when
`NEXT_PUBLIC_GA_ID` is set, so local development stays clean.

---

## 4. Conversion Events

The following custom events are tracked via `src/lib/analytics.ts`:

| Event                   | Trigger                                          | Parameters                        |
|-------------------------|--------------------------------------------------|-----------------------------------|
| `quiz_completed`        | User finishes a quiz session                     | `topic` (string), `score` (number)|
| `plan_generated`        | AI generates a learning plan for a topic         | `topic` (string)                  |
| `subscription_purchased`| Razorpay payment verified and premium activated  | `plan_type` (string), `amount` (number) |

To view these in GA4:
1. Go to Configure → Events → Mark as Conversion for `subscription_purchased`
2. Create a Funnel Exploration: topics page → quiz → subscription

---

## 5. ads.txt

`public/ads.txt` is a placeholder for future programmatic advertising.
When you sign up with an ad network (e.g. Google AdSense), replace the file
with the required publisher declaration line, e.g.:

```
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```
