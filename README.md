# Helio Bond — Landing Page

A static landing page for Helio Bond, a Nigerian marketplace that connects homeowners with verified solar installers. It uses plain HTML, CSS and JavaScript, with no build step and no dependencies.

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
| `assets/js/main.js` | Mobile menu, header scroll state, image-failure fallback and footer year. The page also works without it |
| `assets/img/logo-mark.svg`, `logo-mark-light.svg` | Placeholder logo mark (light version for the dark footer) |
| `get-started.html` | **Placeholder route** for homeowner onboarding (`#homeowners`) and installer applications (`#installers`) |
| `legal.html` | **Placeholder** Privacy Policy (`#privacy`) and Terms of Service (`#terms`) |

## Still to supply before launch

- **Photography.** The images are Unsplash URLs (`images.unsplash.com/photo-…`) and can be replaced. Swap them for licensed or owned photos, ideally of Nigerian homes and installations, and host them locally (for example in `assets/img/`). If an image fails to load, its frame shows a styled gradient instead of a broken-image icon.
- **Logo.** The current mark is a simple placeholder SVG.
- **Onboarding flows.** All homeowner CTAs point to `get-started.html`. The installer CTA points to `get-started.html#installers`.
- **Contact details.** The footer has placeholder text for phone, email and office address.
- **Social links.** None are shown. There is a comment in the footer where they should go.
- **Testimonials.** The "Our standards" section has a testimonial-ready layout (see the HTML comment) but no customer quotes.
- **Articles.** The resources section shows planned guide titles marked "Coming soon". Link each card once the article is published.
- **Legal copy.** Privacy Policy and Terms of Service.
