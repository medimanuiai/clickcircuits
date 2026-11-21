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
- The header and footer are repeated in every page. Change them in all nine pages together.
- Events live in one place: the `EVENTS` list in `js/main.js`. The contact email is `CONTACT_EMAIL` in the same file; it also appears in the HTML mailto links.
- Design tokens (colors, fonts, radii, spacing) are the CSS variables at the top of `css/styles.css`. Fonts are Manrope and Inter from Google Fonts.
- Do not use em dashes or en dashes anywhere on the site. `scripts/check-site.mjs` fails if it finds one.
- Do not add claims the owner has not confirmed (nonprofit status, partner names, testimonials, events, metrics).
