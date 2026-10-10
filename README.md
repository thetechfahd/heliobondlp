# Heliobond — Landing Page

A static landing page for Heliobond, a Nigerian marketplace that connects homeowners with verified solar installers. It uses plain HTML, CSS and JavaScript, with no build step and no dependencies.

## Run

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The landing page |
| `assets/css/styles.css` | All styles. Design tokens (colours, type, spacing, radii, container) are defined in `:root` |
| `assets/js/main.js` | Mobile menu, header scroll state, video testimonial player, image-failure fallback and footer year. The page also works without it |
| `assets/img/heliobond-logo.png` | Heliobond logo on a transparent background, for light backgrounds |
| `assets/img/heliobond-logo-light.png` | Logo with "Helio" and the right ring in white, for the dark footer |
| `assets/img/heliobond-mark.png` | Icon only, used as the favicon |
| `assets/img/hero-family.webp`, `hero-family-800.webp` | Hero photo (full size and a smaller version for phones) |
| `get-started.html` | **Placeholder route** for homeowner onboarding (`#homeowners`) and installer applications (`#installers`) |
| `legal.html` | **Placeholder** Privacy Policy (`#privacy`) and Terms of Service (`#terms`) |

## Still to supply before launch

- **Photography.** The images are Unsplash URLs (`images.unsplash.com/photo-…`) and can be replaced. Swap them for licensed or owned photos, ideally of Nigerian homes and installations, and host them locally (for example in `assets/img/`). If an image fails to load, its frame shows a styled gradient instead of a broken-image icon.
- **Hero statistics.** The four hero figures (500+ homes, 3,000+ kVA, 200+ testimonials, 4.8 Google rating) are sample figures. Confirm them against your records in `index.html` (search for `TRUST STATS`).
- **Video testimonials.** Each card in the Testimonials section takes a `data-video` value: an `.mp4` path (for example `assets/video/customer-1.mp4`) or a YouTube link. Also set the poster image, customer name and city. Cards without a video show "Video coming soon". There are six cards, each with a case-study note (system installed, quotes compared, result). The notes are sample content, so replace them with real project details.
- **Press and partner logos.** The "As seen on" (Punch, Vanguard, TechCrunch, TechCabal, Premium Times, ThisDay Live) and "Our partners" (Rivy, SunFi, CreditDirect, COREN, REA) strips show text placeholders. Save the official logo files in `assets/img/logos/` and swap each `<span class="wordmark">` for an `<img>` (see the comment in `index.html`). Only list outlets that have actually covered Heliobond and organisations you have a formal partnership with, and get permission before using a partner's logo.
- **Logo files.** The PNGs were cut from the supplied JPG. An SVG or high-resolution original from the designer would be sharper.
- **Onboarding flows.** All homeowner CTAs point to `get-started.html`. The installer CTA points to `get-started.html#installers`.
- **Contact details.** The footer has placeholder text for phone, email and office address.
- **Social links.** None are shown. There is a comment in the footer where they should go.
- **Articles.** The resources section shows planned guide titles marked "Coming soon". Link each card once the article is published.
- **Legal copy.** Privacy Policy and Terms of Service.
