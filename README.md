# Post Oak Strategies website

Static site (plain HTML, CSS and JavaScript) in `website/`, deployed to GitHub Pages by `.github/workflows/deploy.yml` whenever `main` is pushed. Custom domain: `postoakstrategies.com` (DNS at Namecheap, see `website/CNAME`).

## Pages

| File | What it is |
|---|---|
| `website/index.html` | Homepage, including the live sample visuals and the contact form |
| `website/home.css`, `website/home.js` | Homepage styles and animations (cash river, budget bridge, cash fan; all sample data) |
| `website/demo.html` | Redirect from the retired sample-dashboard page to `/#see` |
| `website/privacy.html` | Privacy and data-handling page |
| `website/404.html` | Branded not-found page (GitHub Pages serves it automatically) |
| `website/robots.txt`, `website/sitemap.xml` | Search-engine basics; update `lastmod` when pages change |
| `website/assets/og-image.jpg` | 1200x630 image shown when the site is shared |
| `website/styles.css`, `website/site.js` | Styles and nav for the privacy and 404 pages |
| `website/contact-form.js` | Contact form logic |

## Run locally

```bash
python3 -m http.server 8765 --directory website
```

Then open http://localhost:8765.

## Contact form

Submissions go through [FormSubmit](https://formsubmit.co), which emails each message to `ben@postoakstrategies.com`. No account is needed. The endpoint is the `data-endpoint` attribute on `<form id="lead-form">` in `website/index.html`.

**First-time activation:** FormSubmit sends one activation email to `ben@postoakstrategies.com` the first time the form is used. Click the link in it once; after that every submission arrives as a normal email, with the visitor's email set as the reply-to.

If the endpoint is ever left empty, the form falls back to opening the visitor's email app and says nothing has been sent until they press send.

To switch to Formspree (adds a dashboard of submissions): create a form there, put its URL (`https://formspree.io/f/xxxxxxxx`) in `data-endpoint`, and update the service name in `website/privacy.html`.

No secret keys go in the code. Spam filtering is handled by the service, plus a honeypot field named `_honey`.

Test checklist: submit with empty fields (errors appear), submit with a bad email (error appears), submit a real test (success message shown and the email arrives), and confirm the failure message appears if the endpoint is temporarily broken.

## Sample visuals

The homepage charts (cash river, budget bridge, 1,000-year cash fan) run on small made-up datasets inside `website/home.js`. They respect reduced-motion settings.

## Known follow-ups

- Booking link: the old Calendly URL returned 404 and was removed. Add a real scheduling link to the contact section once one exists.
- The site shows `ben@postoakstrategies.com`, the mailbox that exists. If you add an `info@` alias you can switch back.
