# ClickCircuits

The Click Circuits website: a static HTML/CSS/JS site with no build step and no
backend required.

## Getting the code

Clone the repository to your computer:

```bash
git clone https://github.com/medimanuiai/clickcircuits.git
cd clickcircuits
```

## Running it locally

This is a static site, so you just need to serve the folder and open it in a
browser. Pick whichever option matches what you already have installed.

### Option 1: Node.js

```bash
npm install
npm start
```

Then open http://localhost:3000 in your browser.

### Option 2: Python (no extra install needed if Python 3 is already on your machine)

```bash
python -m http.server 8000
```

Then open http://localhost:8000 in your browser.

### Option 3: Just open the file directly

You can also double-click `index.html`, or open it from a terminal:

```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

> Note: some browsers restrict certain features (like autoplaying videos) when
> pages are opened via `file://` instead of a local server, so Option 1 or 2 is
> recommended if anything looks off.

## Project structure

```
index.html          Home
about.html          About the founder and the initiative
programs.html       Workshops, kits, and talks
impact.html         Numbers, student videos, photos
events.html         Upcoming events and talks
get-involved.html   Volunteer, partner, support
register.html       Event registration (opens an email)
donate.html         Donate a kit
contact.html        Contact
sitemap.xml         Pages for search engines
robots.txt          Crawler rules
css/                One stylesheet with the design tokens at the top
js/                 Menu, motion, video players, events, register form
images/             Site images (images/posters/ holds video poster frames)
videos/             Site videos
scripts/            check-site.mjs, the validator CI runs
```
