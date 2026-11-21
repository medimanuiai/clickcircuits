# Showing up on Google, and Google Search Console

The site already has what search engines read:

- A unique `<title>`, meta description, canonical link and `robots` meta tag on all nine pages.
- Open Graph tags (the preview when a link is shared) and two JSON-LD blocks on the home page (Organization and WebSite).
- `robots.txt` (allows everything, points to the sitemap) and `sitemap.xml` (all nine pages).
- Favicon files in the site root (`favicon.ico`, `favicon-48.png`, `favicon-192.png`, `apple-touch-icon.png`) so the logo can appear in results.
- Real text in every page (no text hidden inside images), alt text on every image, one `<h1>` per page.

None of that helps until the new site is **live**. Google reads https://clickcircuits.org, not this repository, so the order is: deploy first (see `docs/DEPLOYMENT.md`), then verify, then submit the sitemap.

## What Search Console is

Search Console is Google's free dashboard for a site: whether pages are indexed, what people searched to find it, and any errors. Google has to be told who owns the site before it shows any of that. That step is called verification, and it can only be completed by someone who controls the domain or the site files.

## Getting access (pick one)

The domain and hosting belong to the owner (the Hostinger account), so one of these needs them:

1. **Owner adds you as a user (simplest, no site change).** The owner opens Search Console, adds the property `https://clickcircuits.org/` if it is not there yet, then goes to Settings, Users and permissions, Add user, and enters your Google account email with permission **Owner** or **Full**. Nothing changes on the website.
2. **You verify it yourself with an HTML tag.** In Search Console choose Add property, URL prefix, `https://clickcircuits.org/`, then the HTML tag method. Google shows a line like `<meta name="google-site-verification" content="XXXX">`. Send that line to Claude Code (or paste it into the `<head>` of `index.html`, right after the robots tag), open a PR, and once it is deployed press Verify. The token is public by design, it is safe to commit.
3. **DNS TXT record (domain property).** Covers every subdomain, but it means editing DNS in Hostinger, which only the owner should do. Claude Code will not touch DNS.

Option 1 is the cleanest. Option 2 works without the owner as long as the deploy path is open.

## After access

1. In Search Console, open Sitemaps and submit `sitemap.xml`.
2. Open URL Inspection, paste `https://clickcircuits.org/`, and press Request indexing. Repeat for `about.html`, `programs.html`, `impact.html`, `events.html`.
3. Check the Pages report a few days later for anything marked "Excluded" or "Error".
4. Expect days to a few weeks before the site shows up for searches like "Click Circuits". A new or recently changed site is not indexed instantly, and nobody can speed that up beyond the steps above.

## Things that help ranking, in order of impact

- Deploy, then request indexing (above).
- Keep the brand name "Click Circuits" in titles and headings (already done) and link to the site from places you control: the founder's profiles, school pages, social bios, and any event listings.
- Add a Google Business Profile only if the owner confirms it applies to the organization. Do not invent an address.
- Do not add keyword lists or hidden text. It hurts more than it helps.

## Not added on purpose

No `Event` structured data yet: Google needs a venue and times for each event, and those are not decided. Add it when the venues are set (the events live in the `EVENTS` list in `js/main.js`).
