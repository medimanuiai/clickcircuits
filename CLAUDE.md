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
- Design direction: light, text-led, Y Combinator-style. No large blue blocks at the top of pages (the only azure band is the compact call to action near the bottom). Body and heading text stays near-black (`--ink`, `--text`, `--muted` are all dark on purpose). Do not add gray body text.
- 3D parts viewer: `js/viewer3d.js` turns any `<div class="viewer" data-viewer="arduino,servo,led">` into a drag-to-rotate model (procedural, no model files). It loads three.js r128 from cdnjs with an SRI hash only when a viewer nears the screen, and falls back to the `.viewer-fallback` photo if WebGL or the CDN is unavailable. Buttons with `data-show="servo"` elsewhere on the page switch the model. Pages that use a viewer must include the script (the checker enforces it).
- Stat rows come in even numbers (four stats, then a countries line) so the grid stays balanced. Keep it even if you add one.
- `images/work/work-2.jpeg` (group of six students) is cropped by its source file above the eyes. CSS cannot recover the heads; replace it with the uncropped original when available. Never use `images/work/work-1.png` (classroom photo) anywhere.
- The header and footer are repeated in every page. Change them in all nine pages together.
- Events live in one place: the `EVENTS` list in `js/main.js`. The contact email is `CONTACT_EMAIL` in the same file; it also appears in the HTML mailto links.
- Design tokens (colors, fonts, radii, spacing) are the CSS variables at the top of `css/styles.css`. The brand color is Azure `#0A7CFF` (`--azure`); white text on it is only 3.9:1, so small text on blue sits on `--azure-strong` (`#0A6AE6`). Fonts are Outfit and Inter from Google Fonts.
- The logo is the click-cursor mark: `images/logo-mark.svg` (header, footer) and `favicon.svg` (round badge). Browser-tab and search-result icons are `favicon.ico`, `favicon-48.png`, `favicon-192.png`, `apple-touch-icon.png` in the site root, linked from every page head. Search engines need the icon files at the root, at least 48x48, so do not move them.
- Photos are lightly enhanced (denoise, sharpen, tone) and saved at high JPEG quality. Keep the same file names so live URLs keep working.
- Do not use em dashes or en dashes anywhere on the site. `scripts/check-site.mjs` fails if it finds one.
- Do not add claims the owner has not confirmed (nonprofit status, partner names, testimonials, events, metrics).
