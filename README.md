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
| `get-quotes.html` | The quote request page, including the appliance calculator |
| `track.html` | Application tracking: status, recommended installer with trust score, side-by-side comparison, and choosing an installer (`assets/js/track.js`). `track.html?example=1` shows labelled sample data |
| `thank-you.html` | Where visitors land after a successful request (`?status=saved` for requests kept on file) |
| `assets/js/quote.js` | The quote request form |
| `units.html` | All-in-one unit catalogue. Filters by what a unit runs (and brand, secondary). `units.html?brand=itel` lands pre-filtered. Each card links to `get-quotes.html?unit=<id>` |
| `assets/data/units.js` | The all-in-one unit catalogue (one record per unit) and `HB_UNITS_CONFIG`. Edit units here only |
| `assets/js/allinone.js` | All-in-one fit checks, generated capability lines and price lines, using the quiz's own load calculation |
| `assets/js/units-page.js` | Filters and cards on `units.html` |
| `assets/js/main.js` | Mobile menu, header scroll state, video testimonial player, image-failure fallback and footer year. The page also works without it |
| `assets/img/heliobond-logo.png` | Heliobond logo on a transparent background, for light backgrounds |
| `assets/img/heliobond-logo-light.png` | Logo with "Helio" and the right ring in white, for the dark footer |
| `assets/img/heliobond-mark.png` | Icon only, used as the favicon |
| `assets/img/hero-family.webp`, `hero-family-800.webp` | Hero photo (full size and a smaller version for phones) |
| `get-started.html` | **Placeholder** for installer applications (`#installers`). Homeowner buttons go to solar.heliobond.com |
| `legal.html` | **Placeholder** Privacy Policy (`#privacy`) and Terms of Service (`#terms`) |

## Still to supply before launch

- **Photography.** The images are Unsplash URLs (`images.unsplash.com/photo-…`) and can be replaced. Swap them for licensed or owned photos, ideally of Nigerian homes and installations, and host them locally (for example in `assets/img/`). If an image fails to load, its frame shows a styled gradient instead of a broken-image icon.
- **Hero statistics.** The hero shows four offer facts (20% down, quotes in 24 hours, free to compare, COREN-accredited installers only). Once you can evidence proof figures (homes powered, kVA installed, a Google rating linked to the real listing), swap them in `index.html` (search for `OFFER FACTS`).
- **Video testimonials.** Each card in the Testimonials section takes a `data-video` value: an `.mp4` path (for example `assets/video/customer-1.mp4`) or a YouTube link. Also set the poster image, customer name and city. Cards without a video show "Video coming soon". There are six cards, each with a case-study note (result, then inverter, battery and panels). The notes are sample content, so replace them with real project details.
- **Logo permissions.** Both sliders now use official logo files in `assets/img/logos/` (press: Punch, Vanguard, TechCrunch, TechCabal, Premium Times, ThisDay; partners: Rivy, SunFi, CreditDirect, COREN, REA). Only list outlets that have covered Heliobond and organisations you formally partner with, and get permission before using a partner's logo — especially COREN and REA, which are government bodies.
- **Logo files.** The PNGs were cut from the supplied JPG. An SVG or high-resolution original from the designer would be sharper.
- **Quote form.** Every homeowner button opens `get-quotes.html`, a step-by-step request form for homes only (`assets/js/quote.js`). It sends leads to the Heliobond quote API at `https://solar.heliobond.com/api/` (`send_otp.php`, then `submit.php`), the same system as solar.heliobond.com, tagged `source: "landing-page"`. The same script can also run as a popup if needed: give any element a `data-quote` attribute and include the popup markup.
- **Appliance calculator data.** Visitors pick appliances from a dropdown, set how many they have, how many of them run at night and for how many hours, and build a list they can add to or remove from. Each request also sends `ownership` (Owner, Family house or Renting), `roofShade` (No shade, Some shade, Heavy shade or Not sure), `instalmentInterest` (true when the visitor chose "above my budget" or "not ready yet" on the investment step; both now lead to the instalment explainer instead of out of the funnel), `upfrontBudget` (optional amount in naira they could pay upfront), `appliances` (a list like "3 x Air conditioner (1.5 HP) (1300W, 1 of 3 at night for 5h)"), `loadWatts`, `nightKwh`, `recommendedKva`, `recommendedBatteryKwh` and `projectedSpend`. The quote API at solar.heliobond.com must be updated to save these fields; until then it will likely ignore them. Projection rules: inverter = total load ÷ 0.8 power factor × 1.25 surge margin, rounded up to the next standard size; battery = night energy (only the units that run at night) ÷ 0.8 usable capacity ÷ 0.9 inverter efficiency, rounded up to 2.5 kWh; spend = the "From" price for that inverter size.
- **Installer applications.** "Apply as an Installer" still points to the placeholder `get-started.html#installers`.
- **Phone number.** The footer shows `028137890976` as supplied. Double-check it; a Nigerian mobile number is usually 11 digits (e.g. `0813 789 0976`).
- **Social links.** None are shown. There is a comment in the footer where they should go.
- **Blog.** The six blog cards (titles, excerpts, authors, dates) are sample content and are not linked yet. Once the articles exist, wrap each title in a link to its post (see the comment in `index.html`), and use real author names.
- **Legal copy.** Privacy Policy and Terms of Service.

## All-in-one units

Every visitor still does the appliance audit; units are shown only once their load is known.

- **Catalogue.** Edit `assets/data/units.js`. Leave `price_low`, `price_high`, `warranty_months` or `surge_w` as `null` until confirmed: the price line is then hidden ("Installers quote the price"), and an unknown surge figure is treated as no headroom above the rated output. Set `status` to `out_of_stock` or `retired` to stop offering a unit. With no active units the quiz behaves exactly as before, apart from the growth question.
- **Prices.** Shown as a band with the check date (`₦279,000 – ₦380,000 · checked 24 Oct`), or `From …` when only one bound is known. Update `price_checked` whenever you re-check.
- **Fit rule** (`assets/js/allinone.js`). A unit fits when the list's load is at most 80% of its rating, its night energy (÷ 0.9 inverter efficiency) is at most the unit's usable kWh, and its start-up surge is within the unit's surge rating. Surge assumption: the largest motor load (fridge, freezer, AC, pump, washing machine) draws 3x its running watts at start-up, as there is no per-appliance surge data yet.
- **Capability lines** ("Covers 6 bulbs, 2 ceiling fans…") are generated by running standard baskets through the same appliance table. Do not hand-write them.
- **Where it appears.** A live counter in the appliance step; a growth question ("Do you expect to power more…") just before the system-size step; two tracks on the system-size step (all-in-one, shortlist up to 3, and the existing custom ladder unchanged); and, when nothing fits, three options: essentials only, custom build, or keep a unit anyway (the gap is recorded).
- **Request fields.** `track` (`custom`, `allinone` or `essentials`), `shortlisted_units` (unit ids), `mismatch` (`null` or `{ unit_id, reason, uncovered_appliances }` when the visitor keeps a unit that does not carry their list), `growth_expectation` (`none`, `unsure` or `yes`) and `entry_intent` (unit id or brand from a `units.html` link). All-in-one requests skip the quality and investment questions and send the projected size in `kva`. The quote API must be updated to save these.
- **Fulfilment.** `HB_UNITS_CONFIG.fulfilment` is `'installer'` (installers quote to supply and fit). `'direct'` is reserved for when Heliobond supplies units itself, so the all-in-one track can go straight to a price and payment plan.

## Tracking API (to be built on solar.heliobond.com)

The quote form now sends a `trackingId` (for example `HB-7K2Q9M`) with every request. Store it with the lead. The tracking page expects:

- `GET https://solar.heliobond.com/api/track.php?id=HB-XXXXXX` returns the application as JSON:
  `trackingId`, `submittedAt` (ISO date), `name` (first name), `state`, `system` (`kva`, `batteryKwh`, `spend`),
  `status` (`submitted`, `matching`, `quotes_ready`, `installer_chosen`, `audit_scheduled` or `installed`),
  `chosenInstallerId`, and `installers` (a list). Each installer has `id`, `name`, `initials`, `area`, `recommended` (true for one),
  `coren`, `years`, `installs`, `rating`, `reviews`, `onTimeRate`, `responseHours`,
  `scores` (`accreditation`, `trackRecord`, `reviews`, `onTime`, `responsiveness`, each 0 to 100),
  `quote` (`price`, `inverter`, `battery`, `panels`, `warranty` with `panels`/`inverter`/`battery`/`workmanship` in years, `installDays`, `audit`),
  and optionally `reasons` (plain-language reasons for the recommendation). The full shape is the `EXAMPLE` object in `assets/js/track.js`.
- `POST https://solar.heliobond.com/api/choose_installer.php` with `{ "trackingId": "...", "installerId": "..." }` returns `{ "success": true }`.
  This is where the homeowner's contact details should be released to the chosen installer only.

The trust score is a weighted average of the five `scores`: accreditation 20%, track record 25%, reviews 25%, on-time delivery 20%, responsiveness 10%.
Until these endpoints exist, entering a real ID shows a "couldn't load" message, and `track.html?example=1` demonstrates the full flow with sample data (nothing is sent).
