# Fireside Law

Static marketing site for a solo law practice. Vanilla HTML/CSS/JS, no build step, deployed to Vercel.

## Stack

- One HTML file per page at the repo root.
- All CSS lives inside each file's `<style>` block. No shared stylesheet.
- All JS lives inside `<script>` blocks. No bundler, no framework.
- Three.js loads via CDN importmap when used. Limit it to sandbox pages — don't add it to production pages without a clear reason.
- Google Fonts: **Playfair Display** (display headlines) + **Inter** (body, labels, nav).

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home. FIRESIDE.LAW hero with the hover-driven color swap. |
| `contact.html` | Split-screen contact form (Formspree endpoint `mvzddyyd`). |
| `evhrt.html` | Internal HRT contingency-fee analysis dashboard. |
| `threejs-starter.html` | Three.js sandbox. Not linked from production. |

## Design language

Reuse these tokens on new pages — they are the brand.

- **Cream background** `#f2ede8`
- **Warm charcoal** `#2a2421` for dark surfaces (never pure black)
- **Crimson accent** `#c0392b`
- **Muted gray** `#8A8580` for eyebrow labels and secondary text
- **Near-black** `#111` for primary text on cream

Typography:
- Display headlines: Playfair Display 900, `line-height: 0.92`
- Labels and nav: Inter 500, uppercase, `letter-spacing: 0.10em`
- Body text: Inter 400

Sizing:
- Use `vw` units for fluid desktop scaling
- Override with `px` inside `@media (max-width: 768px)` for mobile

The crimson `.dot` motif — a single red period inside a `<span class="dot">.</span>` at the end of brand phrases (`LAW.`, `Start the conversation.`, `Message received.`) — is recurring brand grammar. Use it on new headlines.

## Nav pattern

Every page has the same nav: logo on the left, single action button on the right with the crimson hover border. Match `index.html` and `contact.html` markup when adding pages.

## Hosting

- Vercel. `vercel.json` sets `cleanUrls: true`, so `/contact` serves `contact.html` and the `.html` URL redirects to the clean one. Use clean URLs (`/contact`, `/`) in internal links.
- Pushes to `master` trigger a production deploy. Flag the deploy implication to the user before pushing.

## Forms

- Contact form posts to Formspree endpoint `mvzddyyd` via `fetch` with `Accept: application/json`.
- Free tier caps at **50 submissions/month**. Flag if traffic suggests this could be exceeded.
- Success and error states are inline (no page reload). Style new form states to match the existing `.form-success` / `.form-error` patterns.

## Commits

- Claude is the sole author of all commits in this repo. Always use `git commit --author="Claude <noreply@anthropic.com>"`.
- Never add `Co-Authored-By` trailers to commit messages.
- Never modify global git config — the user's identity must stay intact for commits they make manually.

## Working with this repo's owner

- **Build one step at a time and stop.** Don't batch multiple steps unless explicitly asked.
- **Prefer the simplest tool that works.** Vanilla > library > framework. Visual flourishes (particles, animation, 3D) need a clear reason — they will be cut otherwise.
- **Explain new tech when you introduce it.** The user is learning alongside you and will ask how things work. Save the back-and-forth by explaining proactively when adding a service, library, attribute, or unfamiliar pattern.
- **Ask before installing or signing up for anything.** Third-party accounts (Formspree, etc.) are the user's to create.
