# Deployment

## Current state (investigated 2026-11-08)
- `clickcircuits.org` is served by **Hostinger** (`platform: hostinger`, `hcdn` headers, Hostinger DNS-parking nameservers).
- The repo had **no** CI, Pages, or deploy config. Text files and videos on the live site are byte-identical to `main`; images are visually identical but were re-encoded (different bytes).
- So a merge to `main` did **not** update the live site; changes were uploaded to Hostinger separately.

## Publishing options (choose one, needs the Hostinger account owner)

### A. GitHub Action over FTP (included, disabled by default)
1. hPanel -> Files -> FTP Accounts: create/locate an FTP account whose directory is the site's `public_html`.
2. GitHub repo -> Settings -> Secrets and variables -> Actions:
   - Secrets: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`
   - Variable: `DEPLOY_ENABLED=true` (optional `FTP_SERVER_DIR`, default `public_html/`)
3. Merging to `main` now runs `.github/workflows/deploy.yml`. It validates, then uploads only changed site files; it never deletes files it didn't upload.
To pause deploys, set `DEPLOY_ENABLED` to anything other than `true`.

### B. Hostinger Git integration
hPanel -> Websites -> Git: connect `https://github.com/medimanuiai/clickcircuits.git`, branch `main`, then add the webhook URL Hostinger shows under GitHub repo -> Settings -> Webhooks. Note this deploys the repo root, including `README.md`, `scripts/` and `docs/`.

## Rollback
Revert the merge commit on `main` (a PR via `git revert`); the deploy workflow republishes the previous files.
