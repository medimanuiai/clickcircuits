# Click Circuits — working agreement

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
