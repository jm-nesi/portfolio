# [Your Name]: Systems Developer Portfolio

Portfolio site with two interactive demos of internal HR systems I build and maintain:

| Demo | What it shows | Path |
|---|---|---|
| **HR Portal** (back office) | Dashboard, employees, attendance, infractions, 7 request queues, leave credits and protocols, trackers, announcements, audit trail | `demo/hr/` |
| **Employee Portal** (self-service) | Time-in, attendance calendar, leave / time adjustment / overtime forms, team approvals, payslips, themes | `demo/portal/` |

The demos are **static, anonymized replicas**: plain HTML, CSS and JS with generated data (`demo/shared/data.js`). They contain no real company data, employee records or credentials. The production apps run on Laravel 13 + Livewire 4 with MySQL. The HR demo reuses the production design-system CSS (`theme.css`, `ui.css`, `layout.css`).

Demo logins are pre-filled, and any password works:
- HR Portal: `hr.demo`
- Employee Portal: `24022` (team leader, sees Approvals) or `24001` (regular employee)

## Publish on GitHub Pages

1. Create a public repo on GitHub, for example `your-github.github.io` (served at the root) or `portfolio` (served at `/portfolio/`).
2. From this folder:
   ```sh
   git init
   git add .
   git commit -m "Portfolio with HR system demos"
   git branch -M main
   git remote add origin https://github.com/<your-github>/<repo>.git
   git push -u origin main
   ```
3. On GitHub, open **Settings → Pages → Build and deployment**, set **Source: Deploy from a branch**, and choose **Branch: `main` / `(root)`**.
4. Your site is live in about a minute at `https://<your-github>.github.io/<repo>/`.

All links are relative, so the site works at either URL. `.nojekyll` stops GitHub from running Jekyll.

## Personalise

Search for `[` in `index.html` and replace each placeholder: `[Your Name]`, `[YN]`, `[City, Country]`, `[you@example.com]`, `[your-github]`, `[your-linkedin]`, the dates under Experience, and education. Check the figures in the hero stats too.

## Preview locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```
