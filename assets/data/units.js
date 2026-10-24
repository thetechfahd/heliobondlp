/* All-in-one unit catalogue.
   One record per sealed unit (inverter, battery and charge controller in one
   cabinet). Edit here only; the quiz and units.html both read this list.

   kva          rated output in kVA (a 500 W unit is 0.5)
   usable_kwh   battery energy you can actually use
   surge_w      start-up (peak) capacity in watts; null = not confirmed, and the
                fit check then assumes no headroom above the rated output
   price_low/high  naira range seen across sellers; null = not confirmed, and
                the price line is hidden rather than guessed
   price_checked   date the prices were last checked (YYYY-MM-DD)
   status       active | out_of_stock | retired (only active units are offered)

   Capability lines ("Covers 6 bulbs, 2 fans…") are generated from the quiz's
   appliance table in assets/js/allinone.js. Do not add hand-written blurbs. */
window.HB_UNITS = [
  {
    id: 'itel-iess-05k10n',
    brand: 'itel',
    model: 'Power Tank IESS-05K10N',
    kva: 0.5,
    usable_kwh: 1.0,
    surge_w: null,
    price_low: 279000,
    price_high: 380000,
    price_checked: '2026-10-24',
    panels_included: false,
    panel_detail: '',
    warranty_months: null,
    stackable: false,
    photo: '',
    status: 'active'
  },
  {
    id: 'haisic-prince',
    brand: 'Haisic',
    model: 'All-in-One Prince',
    kva: 1.5,
    usable_kwh: 4.0,
    surge_w: null,
    price_low: null,
    price_high: null,
    price_checked: '',
    panels_included: false,
    panel_detail: '',
    warranty_months: null,
    stackable: false,
    photo: '',
    status: 'active'
  },
  {
    id: 'haisic-king',
    brand: 'Haisic',
    model: 'All-in-One King (HS-TQS4.2KW+8038.4Wh)',
    kva: 4.2,
    usable_kwh: 8.0,
    surge_w: 8400,
    price_low: null,
    price_high: null,
    price_checked: '',
    panels_included: false,
    panel_detail: '',
    warranty_months: null,
    stackable: false,
    photo: '',
    status: 'active'
  }
];

/* How all-in-one requests are fulfilled.
   'installer': installers quote to supply and fit the shortlisted units (today).
   'direct':    Heliobond supplies the unit itself. Reserved for later; when
                switched on, the all-in-one track can go straight to a price and
                payment plan instead of gathering quotes. */
window.HB_UNITS_CONFIG = { fulfilment: 'installer', maxShortlist: 3 };
