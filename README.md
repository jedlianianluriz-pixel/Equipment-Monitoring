# IT Equipment Monitoring System

Equipment register, accountability/deployment form, repair & calibration history, dashboard, user accounts (admin = full control, user = view-only), glass UI with selectable color themes, live clock and network status.

Plain HTML/CSS/JavaScript. No build step, no dependencies.

## Structure

```
index.html            app markup
css/styles.css        all styles
js/app.js             records, login/accounts, dashboard, forms, printing
js/*.js               theme, sidebar/setup panel, clock, glass dropdowns, network status
assets/               logos
.github/workflows/    GitHub Pages deploy
```

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to GitHub Pages

1. Create a repo and push this folder to the `main` branch.
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` deploys automatically. The site appears at
   `https://<your-username>.github.io/<repo-name>/`.

(Netlify, Vercel, Cloudflare Pages or any static host also work: publish the repo root.)

## First login

Default admin: `admin` / `admin123`. **Change it immediately** (click your name chip, top right).

## Important limitations

- **Data is stored in each browser (localStorage).** Records, accounts and settings are *not* shared between computers. Use **Reports & Export** to back up and move data between workstations.
- **Login is client-side only.** It controls the UI but is not real security, since anyone can open the site's code. Do not put the app on a public URL if the records are confidential: use a private repo with GitHub Enterprise Pages, or host behind an authenticated service (Cloudflare Access, Netlify password, company intranet).
- For true multi-user shared data, the storage layer (`readStore` / `writeStore` in `js/app.js`) would need to be pointed at a backend such as Firebase or Supabase.
