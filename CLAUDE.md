# Click Circuits: working agreement

Static site (HTML/CSS/JS, no build step) for https://clickcircuits.org, hosted on Hostinger.

## Workflow
1. Never commit to `main`. Create a branch (`git checkout -b feature/<name>`).
2. Make the change, then run `node scripts/check-site.mjs` and preview with `npm start` (http://localhost:3000).
3. Push the branch and open a PR. CI (`.github/workflows/ci.yml`) must pass.
4. Merge the PR. If deployment is enabled (see `docs/DEPLOYMENT.md`), the merge publishes to the live site.

## Rules
- Do not change DNS, hosting, or the domain. Do not commit credentials.
- Keep file paths stable: live URLs (`about.html`, `impact.html`, `images/...`, `videos/...`) must keep working.
- Plain HTML/CSS/JS only; no build tooling unless the owner approves.
- Goal of the site: Click Circuits helps the next generation learn how AI works and how to build with it, through AI talks, hands-on workshops, and a learning platform that is coming to this site. Lead with that.
- Design direction: one blue (the logo blue `--blue` #0A7CFF), white, and near-black. Flat colors only: no gradients, glows, dot patterns, or extra shades (the checker fails on `gradient(`). `--blue-lip` is only the solid "press" edge under blue buttons and panels. Feel: friendly and chunky like Duolingo (rounded corners, 2px borders, a solid lip under buttons and cards that presses down on click), with plain, text-led Y Combinator-style layouts. No eyebrow labels, no fade-in or count-up animations, no hover zooms. Page tops are white; blue comes from the stats band, call-to-action bands, the 3D stage, buttons, and the footer. Never put a big solid blue block at the very top of a page. Text on blue is always large or bold (white on the logo blue is 3.9:1), so buttons are 19px bold. The logo has no hover or click effect on purpose; do not add one.
- It is an initiative (part non-profit in spirit), but do not claim non-profit status. Avoid repeating the same fact on one page or across neighbouring pages (the 232 / 102 numbers live in the stats band, "one kit helps five" lives on Home and Donate, talk topics live on Programs). The kit viewer lives only on Home.
- Kit part viewer: real photos, not models. `js/viewer3d.js` turns `<div class="viewer" data-viewer>` into a photo of the part that tilts and turns in 3D when dragged (CSS 3D transforms, the photo stacked into a few layers so it has an edge). Buttons with `data-show="servo"` inside the same `[data-kit]` section switch the part. Photos are `images/parts/<part>.webp`, cut out of their white background; the name, description, and photo credit for each part are in the `PARTS` list at the top of `js/viewer3d.js`. Sources and licences are in `docs/PHOTO-CREDITS.md`. To use a photo of the real kit, shoot it on plain white, cut it out, save it under the same name, and update its credit.
- Search: every page has a robots meta tag, canonical link and JSON-LD on Home; `robots.txt` and `sitemap.xml` list all nine pages. See `docs/SEARCH-CONSOLE.md` for getting verified in Google Search Console. A new page must be added to `sitemap.xml` (the checker fails otherwise).
- Stat rows come in even numbers (four stats, then a countries line) so the grid stays balanced. Keep it even if you add one.
- `images/work/work-2.jpeg` (group of six students) is cropped by its source file above the eyes. CSS cannot recover the heads; replace it with the uncropped original when available. Never use `images/work/work-1.png` (classroom photo) anywhere.
- The header and footer are repeated in every page. Change them in all nine pages together.
- Events live in one place: the `EVENTS` list in `js/main.js`. The contact email is `CONTACT_EMAIL` in the same file; it also appears in the HTML mailto links.
- Design tokens (colors, fonts, radii, spacing) are the CSS variables at the top of `css/styles.css`. Fonts are Outfit (headings, 600 to 800) and Inter (text) from Google Fonts.
- The logo is the click-cursor mark: `images/logo-mark.svg` (header), `images/logo-mark-white.svg` (footer, on blue), and `favicon.svg` (round badge). Browser-tab and search-result icons are `favicon.ico`, `favicon-48.png`, `favicon-192.png`, `apple-touch-icon.png` in the site root, linked from every page head. Search engines need the icon files at the root, at least 48x48, so do not move them.
- Photos are lightly enhanced (denoise, sharpen, tone) and saved at high JPEG quality. Keep the same file names so live URLs keep working.
- Do not use em dashes or en dashes anywhere on the site. `scripts/check-site.mjs` fails if it finds one.
- Do not add claims the owner has not confirmed (nonprofit status, partner names, testimonials, events, metrics).
