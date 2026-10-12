/* Heliobond — application tracking page (track.html).

   Live data comes from the Heliobond API (to be added on solar.heliobond.com):
     GET  {API}track.php?id=HB-XXXXXX            -> application JSON (shape: see EXAMPLE below)
     POST {API}choose_installer.php              {trackingId, installerId} -> {success: true}

   track.html?example=1 shows clearly labelled sample data so the design can be
   reviewed before the API exists. Add &status=matching|quotes_ready|installer_chosen
   to preview each state. Nothing is sent in example mode. */
(function () {
  'use strict';

  var API = 'https://solar.heliobond.com/api/';
  var root = document.getElementById('tr-root');
  var dialog = document.getElementById('tr-dialog');
  var params = new URLSearchParams(location.search);
  var exampleMode = params.get('example') === '1';
  var app = null;          // the application being shown
  var showCompare = false;

  var STAGES = [
    { key: 'submitted', label: 'Request submitted' },
    { key: 'matching', label: 'Matching installers' },
    { key: 'quotes_ready', label: 'Quotes ready' },
    { key: 'installer_chosen', label: 'Installer chosen' },
    { key: 'audit_scheduled', label: 'Home audit' },
    { key: 'installed', label: 'Installed' }
  ];

  /* Trust score: weighted from five sub-scores (each out of 100). */
  var SCORE_PARTS = [
    { key: 'accreditation', label: 'COREN accreditation', weight: 0.2 },
    { key: 'trackRecord', label: 'Track record', weight: 0.25 },
    { key: 'reviews', label: 'Customer reviews', weight: 0.25 },
    { key: 'onTime', label: 'On-time delivery', weight: 0.2 },
    { key: 'responsiveness', label: 'Responsiveness', weight: 0.1 }
  ];
  function trustScore(inst) {
    return Math.round(SCORE_PARTS.reduce(function (sum, p) { return sum + inst.scores[p.key] * p.weight; }, 0));
  }
  function scoreWord(n) { return n >= 90 ? 'Excellent' : n >= 80 ? 'Very good' : n >= 70 ? 'Good' : 'Fair'; }

  /* ---------- Example data (clearly labelled on the page) ---------- */
  var EXAMPLE = {
    trackingId: 'HB-7K2Q9M',
    submittedAt: '2026-10-09T10:24:00+01:00',
    name: 'Ngozi',
    state: 'Lagos',
    homeType: 'Duplex',
    system: { kva: '5', batteryKwh: 10, spend: 'From ₦4.7M' },
    status: 'quotes_ready',
    chosenInstallerId: null,
    installers: [
      {
        id: 'sunbridge', name: 'Sunbridge Energy Ltd', initials: 'SE', area: 'Ikeja, Lagos', recommended: true,
        coren: 'COREN R.12458', years: 7, installs: 148, rating: 4.8, reviews: 96, onTimeRate: 96, responseHours: 2,
        scores: { accreditation: 100, trackRecord: 92, reviews: 95, onTime: 96, responsiveness: 92 },
        quote: {
          price: 4950000, inverter: '5 kVA hybrid inverter', battery: '10 kWh lithium (LiFePO4)', panels: '8 × 550 W panels',
          warranty: { panels: 25, inverter: 5, battery: 5, workmanship: 2 }, installDays: 3, audit: 'This week'
        },
        reasons: [
          'Highest trust score of your three quotes',
          'Longest warranties: 5 years on the inverter and battery, 2 years on workmanship',
          'Most homes installed, with 96% finished on time',
          'Only ₦330,000 more than the cheapest quote, for a bigger battery and longer cover'
        ]
      },
      {
        id: 'lumen', name: 'Lumen Power Systems', initials: 'LP', area: 'Lekki, Lagos',
        coren: 'COREN R.20931', years: 4, installs: 62, rating: 4.5, reviews: 41, onTimeRate: 88, responseHours: 6,
        scores: { accreditation: 100, trackRecord: 78, reviews: 88, onTime: 88, responsiveness: 80 },
        quote: {
          price: 4620000, inverter: '5 kVA hybrid inverter', battery: '7.5 kWh lithium (LiFePO4)', panels: '8 × 450 W panels',
          warranty: { panels: 25, inverter: 3, battery: 3, workmanship: 1 }, installDays: 4, audit: 'Next week'
        }
      },
      {
        id: 'greengrid', name: 'GreenGrid Installations', initials: 'GG', area: 'Yaba, Lagos',
        coren: 'COREN R.17604', years: 5, installs: 90, rating: 4.3, reviews: 58, onTimeRate: 79, responseHours: 24,
        scores: { accreditation: 100, trackRecord: 84, reviews: 82, onTime: 79, responsiveness: 65 },
        quote: {
          price: 5300000, inverter: '5 kVA hybrid inverter', battery: '10 kWh lithium (LiFePO4)', panels: '10 × 450 W panels',
          warranty: { panels: 25, inverter: 5, battery: 5, workmanship: 1 }, installDays: 5, audit: 'In 2 weeks'
        }
      }
    ]
  };

  /* ---------- Helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function icon(id, cls) { return '<svg class="' + (cls || '') + '" aria-hidden="true"><use href="#' + id + '"/></svg>'; }
  function years(n) { return n + (n === 1 ? ' year' : ' years'); }
  function naira(n) { return '₦' + Math.round(n).toLocaleString('en-NG'); }
  function upfront(q) { return q.price * 0.2; }
  function balance(q) { return q.price * 0.8; }
  function fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; }
  }
  function responseText(h) { return h < 24 ? 'About ' + h + (h === 1 ? ' hour' : ' hours') : 'About ' + Math.round(h / 24) + (h < 48 ? ' day' : ' days'); }
  function installer(id) { return app.installers.filter(function (i) { return i.id === id; })[0]; }
  function recommended() { return app.installers.filter(function (i) { return i.recommended; })[0] || app.installers[0]; }

  /* ---------- Lookup screen ---------- */
  function renderLookup(message) {
    var last = '';
    try { last = localStorage.getItem('hb-last-tracking') || ''; } catch (e) {}
    root.innerHTML = '<div class="tr-wrap tr-wrap--narrow">' +
      '<section class="tr-lookup">' +
        '<span class="tr-lookup__icon" aria-hidden="true">' + icon('i-search') + '</span>' +
        '<h1 class="tr-h1">Track your application</h1>' +
        '<p class="tr-lead">Enter the tracking ID from your confirmation page or WhatsApp message.</p>' +
        (message ? '<p class="tr-alert" role="alert">' + esc(message) + '</p>' : '') +
        '<form class="tr-lookup__form" id="tr-form" novalidate>' +
          '<label class="qm-label" for="tr-id">Tracking ID</label>' +
          '<div class="tr-lookup__row">' +
            '<input id="tr-id" class="qm-input tr-lookup__input" name="id" placeholder="HB-XXXXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" value="' + esc(params.get('id') || last) + '">' +
            '<button class="btn btn--accent" type="submit">Track<span class="btn__icon" aria-hidden="true">' + icon('i-arrow') + '</span></button>' +
          '</div>' +
        '</form>' +
        '<p class="tr-lookup__example">Want to see how it works? <a href="track.html?example=1">View an example application</a></p>' +
      '</section></div>';
    document.getElementById('tr-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var id = document.getElementById('tr-id').value.trim().toUpperCase().replace(/\s+/g, '');
      if (!/^HB-[A-Z0-9]{6}$/.test(id)) { renderLookup('That doesn\'t look like a tracking ID. It should look like HB-7K2Q9M.'); return; }
      location.href = 'track.html?id=' + encodeURIComponent(id);
    });
  }

  /* ---------- Application screen ---------- */
  function stageIndex(status) {
    for (var i = 0; i < STAGES.length; i++) if (STAGES[i].key === status) return i;
    return 0;
  }

  function header() {
    var s = app.system || {};
    return '<section class="tr-head">' +
      '<div class="tr-head__main">' +
        '<p class="tr-kicker">Application</p>' +
        '<div class="tr-head__id"><h1 class="tr-code">' + esc(app.trackingId) + '</h1>' +
          '<button type="button" class="ty2-copy" data-copy="' + esc(app.trackingId) + '">' + icon('i-copy') + '<span>Copy</span></button></div>' +
        '<p class="tr-head__hello">' + (app.name ? 'Hi ' + esc(app.name) + ', here\'s where your solar request is.' : 'Here\'s where your solar request is.') + '</p>' +
      '</div>' +
      '<dl class="tr-head__meta">' +
        '<div><dt>Submitted</dt><dd>' + esc(fmtDate(app.submittedAt)) + '</dd></div>' +
        '<div><dt>Location</dt><dd>' + esc(app.state || '–') + '</dd></div>' +
        '<div><dt>Projected system</dt><dd>' + (s.kva ? esc(s.kva) + ' kVA' + (s.batteryKwh ? ' · ' + esc(s.batteryKwh) + ' kWh' : '') : '–') + '</dd></div>' +
      '</dl>' +
    '</section>';
  }

  function tracker() {
    var cur = stageIndex(app.status);
    return '<ol class="tr-steps" aria-label="Application progress">' + STAGES.map(function (st, i) {
      var cls = i < cur ? 'is-done' : i === cur ? 'is-current' : '';
      return '<li class="' + cls + '"' + (i === cur ? ' aria-current="step"' : '') + '>' +
        '<span class="tr-steps__dot" aria-hidden="true">' + (i < cur ? icon('i-check') : '') + '</span>' +
        '<span class="tr-steps__label">' + esc(st.label) + '</span></li>';
    }).join('') + '</ol>';
  }

  function scoreRing(n, size) {
    var r = 42, c = 2 * Math.PI * r;
    return '<div class="tr-ring' + (size ? ' tr-ring--' + size : '') + '" role="img" aria-label="Trust score ' + n + ' out of 100">' +
      '<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="tr-ring__track" cx="50" cy="50" r="' + r + '"/>' +
      '<circle class="tr-ring__value" cx="50" cy="50" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - n / 100)).toFixed(1) + '"/></svg>' +
      '<span class="tr-ring__num">' + n + '<small>/100</small></span></div>';
  }

  function matchingPanel() {
    return '<section class="tr-card tr-matching">' +
      '<div class="tr-pulse" aria-hidden="true"><span></span><span></span>' + icon('i-search') + '</div>' +
      '<div><h2 class="tr-h2">We\'re matching you with installers in ' + esc(app.state || 'your area') + '</h2>' +
      '<p class="tr-body">We\'re collecting quotes from COREN-verified installers who suit your home. Quotes usually arrive within 24 hours, and we\'ll message you on WhatsApp the moment they\'re ready.</p></div>' +
    '</section>';
  }

  function recommendedCard(inst) {
    var score = trustScore(inst), q = inst.quote;
    return '<section class="tr-rec" aria-labelledby="tr-rec-name">' +
      '<div class="tr-rec__band">' + icon('i-badge') + 'Heliobond recommends</div>' +
      '<div class="tr-rec__top">' +
        '<div class="tr-who">' +
          '<span class="tr-avatar" aria-hidden="true">' + esc(inst.initials) + '</span>' +
          '<div><h2 class="tr-who__name" id="tr-rec-name">' + esc(inst.name) + '</h2>' +
          '<p class="tr-who__meta">' + icon('i-pin') + esc(inst.area) + '<span>·</span>' + esc(inst.coren) + '</p>' +
          '<ul class="tr-tags"><li class="tr-tag tr-tag--green">' + icon('i-check') + 'COREN verified</li><li class="tr-tag">' + inst.years + ' years in business</li></ul></div>' +
        '</div>' +
        '<div class="tr-score">' + scoreRing(score) + '<p><strong>' + scoreWord(score) + '</strong><span>Heliobond trust score</span></p></div>' +
      '</div>' +

      '<div class="tr-rec__grid">' +
        '<div class="tr-block">' +
          '<h3 class="tr-h3">Trust at a glance</h3>' +
          '<ul class="tr-stats">' +
            '<li><strong>' + icon('i-star', 'tr-star') + inst.rating.toFixed(1) + '</strong><span>' + inst.reviews + ' customer reviews</span></li>' +
            '<li><strong>' + inst.installs + '</strong><span>Homes installed</span></li>' +
            '<li><strong>' + inst.onTimeRate + '%</strong><span>Finished on time</span></li>' +
            '<li><strong>' + esc(responseText(inst.responseHours).replace('About ', '~')) + '</strong><span>Typical reply time</span></li>' +
          '</ul>' +
          '<h3 class="tr-h3 tr-h3--spaced">How the score is made</h3>' +
          '<ul class="tr-bars">' + SCORE_PARTS.map(function (p) {
            var v = inst.scores[p.key];
            return '<li><span class="tr-bars__label">' + esc(p.label) + '</span><span class="tr-bars__track"><i style="width:' + v + '%"></i></span><span class="tr-bars__val">' + v + '</span></li>';
          }).join('') + '</ul>' +
        '</div>' +

        '<div class="tr-block tr-block--quote">' +
          '<h3 class="tr-h3">Their quote</h3>' +
          '<p class="tr-price">' + naira(q.price) + '</p>' +
          '<p class="tr-price__plan">Pay <strong>' + naira(upfront(q)) + '</strong> upfront (20%), then ' + naira(balance(q)) + ' in monthly instalments</p>' +
          '<dl class="tr-spec">' +
            '<div><dt>Inverter</dt><dd>' + esc(q.inverter) + '</dd></div>' +
            '<div><dt>Battery</dt><dd>' + esc(q.battery) + '</dd></div>' +
            '<div><dt>Panels</dt><dd>' + esc(q.panels) + '</dd></div>' +
            '<div><dt>Warranty</dt><dd>Panels ' + years(q.warranty.panels) + ' · Inverter ' + years(q.warranty.inverter) + ' · Battery ' + years(q.warranty.battery) + ' · Workmanship ' + years(q.warranty.workmanship) + '</dd></div>' +
            '<div><dt>Installation</dt><dd>' + q.installDays + ' days on site</dd></div>' +
            '<div><dt>Free home audit</dt><dd>Available ' + esc(q.audit.toLowerCase()) + '</dd></div>' +
          '</dl>' +
        '</div>' +
      '</div>' +

      (inst.reasons && inst.reasons.length ? '<div class="tr-why"><h3 class="tr-h3">Why we recommend them</h3><ul>' + inst.reasons.map(function (r) {
        return '<li>' + icon('i-check') + '<span>' + esc(r) + '</span></li>';
      }).join('') + '</ul></div>' : '') +

      '<div class="tr-rec__actions">' +
        '<button type="button" class="btn btn--accent" data-choose="' + esc(inst.id) + '">Choose ' + esc(inst.name.replace(/ (Ltd|Limited)$/, '')) + '<span class="btn__icon" aria-hidden="true">' + icon('i-arrow') + '</span></button>' +
        '<button type="button" class="tr-compare-toggle" data-action="compare" aria-expanded="' + showCompare + '" aria-controls="tr-compare">' +
          (showCompare ? 'Hide comparison' : 'Compare all ' + app.installers.length + ' quotes side by side') + icon('i-chevron', 'tr-chev') + '</button>' +
      '</div>' +
    '</section>';
  }

  function compareTable() {
    var list = app.installers.slice().sort(function (a, b) { return (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0); });
    var best = function (vals, higher) {
      var target = higher ? Math.max.apply(null, vals) : Math.min.apply(null, vals);
      return vals.map(function (v) { return v === target; });
    };
    function row(label, cells, bestFlags, group) {
      return '<tr' + (group ? ' class="tr-table__group-start"' : '') + '><th scope="row">' + esc(label) + '</th>' + cells.map(function (c, i) {
        return '<td class="' + (list[i].recommended ? 'is-rec' : '') + (bestFlags && bestFlags[i] ? ' is-best' : '') + '">' + c + (bestFlags && bestFlags[i] ? '<span class="tr-best">Best</span>' : '') + '</td>';
      }).join('') + '</tr>';
    }
    var scores = list.map(trustScore);
    var prices = list.map(function (i) { return i.quote.price; });
    var rows = [
      '<tr class="tr-table__section"><th colspan="' + (list.length + 1) + '">Trust</th></tr>',
      row('Trust score', scores.map(function (s) { return '<strong>' + s + '</strong>/100'; }), best(scores, true)),
      row('Customer rating', list.map(function (i) { return '★ ' + i.rating.toFixed(1) + ' <small>(' + i.reviews + ')</small>'; }), best(list.map(function (i) { return i.rating; }), true)),
      row('Homes installed', list.map(function (i) { return i.installs; }), best(list.map(function (i) { return i.installs; }), true)),
      row('Finished on time', list.map(function (i) { return i.onTimeRate + '%'; }), best(list.map(function (i) { return i.onTimeRate; }), true)),
      row('Typical reply time', list.map(function (i) { return responseText(i.responseHours); }), best(list.map(function (i) { return i.responseHours; }), false)),
      row('Years in business', list.map(function (i) { return i.years; }), best(list.map(function (i) { return i.years; }), true)),
      row('COREN registration', list.map(function (i) { return '<span class="tr-ok">' + icon('i-check') + '</span>' + esc(i.coren); })),
      '<tr class="tr-table__section"><th colspan="' + (list.length + 1) + '">Quote</th></tr>',
      row('Total price', prices.map(naira), best(prices, false)),
      row('Upfront (20%)', list.map(function (i) { return naira(upfront(i.quote)); })),
      row('Inverter', list.map(function (i) { return esc(i.quote.inverter); })),
      row('Battery', list.map(function (i) { return esc(i.quote.battery); }), best(list.map(function (i) { return parseFloat(i.quote.battery); }), true)),
      row('Panels', list.map(function (i) { return esc(i.quote.panels); })),
      '<tr class="tr-table__section"><th colspan="' + (list.length + 1) + '">Warranty</th></tr>',
      row('Inverter', list.map(function (i) { return years(i.quote.warranty.inverter); }), best(list.map(function (i) { return i.quote.warranty.inverter; }), true)),
      row('Battery', list.map(function (i) { return years(i.quote.warranty.battery); }), best(list.map(function (i) { return i.quote.warranty.battery; }), true)),
      row('Panels', list.map(function (i) { return years(i.quote.warranty.panels); })),
      row('Workmanship', list.map(function (i) { return years(i.quote.warranty.workmanship); }), best(list.map(function (i) { return i.quote.warranty.workmanship; }), true)),
      '<tr class="tr-table__section"><th colspan="' + (list.length + 1) + '">Timing</th></tr>',
      row('Installation', list.map(function (i) { return i.quote.installDays + ' days'; }), best(list.map(function (i) { return i.quote.installDays; }), false)),
      row('Free home audit', list.map(function (i) { return esc(i.quote.audit); }))
    ];
    var rec = recommended();
    return '<section class="tr-compare" id="tr-compare"' + (showCompare ? '' : ' hidden') + ' aria-label="Compare all quotes">' +
      '<div class="tr-compare__intro"><h2 class="tr-h2">All quotes, side by side</h2>' +
      '<p class="tr-body">We recommend <strong>' + esc(rec.name) + '</strong> because it scores highest on trust and offers the strongest warranty, even though it isn\'t the cheapest. "Best" marks the strongest value in each row.</p></div>' +
      '<div class="tr-table-wrap" tabindex="0" role="region" aria-label="Quote comparison table, scroll sideways to see all installers">' +
      '<table class="tr-table"><thead><tr><th scope="col"><span class="visually-hidden">Detail</span></th>' + list.map(function (i) {
        return '<th scope="col" class="' + (i.recommended ? 'is-rec' : '') + '">' + (i.recommended ? '<span class="tr-rec-flag">Recommended</span>' : '') +
          '<span class="tr-table__who"><span class="tr-avatar tr-avatar--sm" aria-hidden="true">' + esc(i.initials) + '</span>' + esc(i.name) + '</span></th>';
      }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody>' +
      '<tfoot><tr><th scope="row"><span class="visually-hidden">Choose</span></th>' + list.map(function (i) {
        return '<td class="' + (i.recommended ? 'is-rec' : '') + '"><button type="button" class="btn ' + (i.recommended ? 'btn--accent' : 'btn--ghost-dark') + ' btn--sm tr-choose" data-choose="' + esc(i.id) + '">Choose</button></td>';
      }).join('') + '</tr></tfoot></table></div>' +
    '</section>';
  }

  function chosenPanel() {
    var inst = installer(app.chosenInstallerId), q = inst.quote;
    return '<section class="tr-card tr-chosen">' +
      '<div class="tr-chosen__mark" aria-hidden="true">' + icon('i-check') + '</div>' +
      '<p class="qm-eyebrow tr-chosen__eyebrow">Installer chosen</p>' +
      '<h2 class="tr-h2">You chose ' + esc(inst.name) + '</h2>' +
      '<p class="tr-body">We\'ve shared your name, WhatsApp number and project details with ' + esc(inst.name) + '. They\'ll message you on WhatsApp within 24 hours to book your free home audit. The other installers have not received your contact details.</p>' +
      '<div class="tr-chosen__summary">' +
        '<div class="tr-who"><span class="tr-avatar" aria-hidden="true">' + esc(inst.initials) + '</span><div><strong>' + esc(inst.name) + '</strong><span>' + esc(inst.coren) + ' · Trust score ' + trustScore(inst) + '/100</span></div></div>' +
        '<div class="tr-chosen__price"><strong>' + naira(q.price) + '</strong><span>' + naira(upfront(q)) + ' upfront</span></div>' +
      '</div>' +
      '<ol class="tr-next">' +
        '<li><span><strong>Free home audit.</strong> The installer visits to check your roof and confirm the system.</span></li>' +
        '<li><span><strong>Final quote and payment plan.</strong> You pay 20% upfront only when you\'re happy.</span></li>' +
        '<li><span><strong>Installation.</strong> We hold them accountable if anything goes wrong.</span></li>' +
      '</ol>' +
      '<p class="tr-small">Changed your mind? Email <a href="mailto:hi@heliobond.com">hi@heliobond.com</a> with your tracking ID.</p>' +
    '</section>';
  }

  function exampleBanner() {
    if (!exampleMode) return '';
    var states = [['matching', 'Matching'], ['quotes_ready', 'Quotes ready'], ['installer_chosen', 'Installer chosen']];
    return '<div class="tr-example"><div class="tr-wrap tr-example__inner">' +
      '<p><strong>Example application.</strong> Sample data showing how tracking works. Nothing here is real, and nothing is sent.</p>' +
      '<div class="tr-example__states" role="group" aria-label="Preview a status">' + states.map(function (s) {
        return '<button type="button" data-preview="' + s[0] + '" aria-pressed="' + (app.status === s[0]) + '">' + s[1] + '</button>';
      }).join('') + '</div></div></div>';
  }

  function render() {
    var body = '';
    if (app.status === 'submitted' || app.status === 'matching') body = matchingPanel();
    else if (app.status === 'quotes_ready') body = '<div class="tr-intro"><h2 class="tr-h2">Your quotes are ready</h2><p class="tr-body">' + app.installers.length + ' COREN-verified installers sent quotes. We compared them on trust, equipment, warranty and price. Here\'s our pick.</p></div>' + recommendedCard(recommended()) + compareTable();
    else if (app.chosenInstallerId) body = chosenPanel();
    root.innerHTML = exampleBanner() + '<div class="tr-wrap">' + header() + tracker() + body + '</div>';
    animateIn();
  }

  function animateIn() {
    // Fill score rings and bars from zero for a gentle reveal.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var rings = root.querySelectorAll('.tr-ring__value'), bars = root.querySelectorAll('.tr-bars i');
    Array.prototype.forEach.call(rings, function (c) { var to = c.getAttribute('stroke-dashoffset'); c.setAttribute('stroke-dashoffset', c.getAttribute('stroke-dasharray')); requestAnimationFrame(function () { requestAnimationFrame(function () { c.setAttribute('stroke-dashoffset', to); }); }); });
    Array.prototype.forEach.call(bars, function (b) { var to = b.style.width; b.style.width = '0'; requestAnimationFrame(function () { requestAnimationFrame(function () { b.style.width = to; }); }); });
  }

  /* ---------- Choosing an installer ---------- */
  function openChoose(id) {
    var inst = installer(id), q = inst.quote;
    dialog.innerHTML = '<form method="dialog" class="tr-dialog__inner">' +
      '<button type="submit" class="tr-dialog__x" value="cancel" aria-label="Close">' + icon('i-x') + '</button>' +
      '<span class="tr-avatar tr-avatar--lg" aria-hidden="true">' + esc(inst.initials) + '</span>' +
      '<h2 class="tr-h2" id="tr-dialog-title">Choose ' + esc(inst.name) + '?</h2>' +
      '<p class="tr-body">We\'ll send them your <strong>name, WhatsApp number and project details</strong> so they can book your free home audit. The other installers won\'t receive your contact details.</p>' +
      '<dl class="tr-dialog__sum"><div><dt>Quote</dt><dd>' + naira(q.price) + '</dd></div><div><dt>Upfront (20%)</dt><dd>' + naira(upfront(q)) + '</dd></div><div><dt>Trust score</dt><dd>' + trustScore(inst) + '/100</dd></div></dl>' +
      (exampleMode ? '<p class="tr-small tr-dialog__note">Example only: nothing will be sent.</p>' : '') +
      '<p class="tr-alert" role="alert" id="tr-dialog-error" hidden></p>' +
      '<div class="tr-dialog__actions">' +
        '<button type="submit" class="btn btn--ghost-dark" value="cancel">Not yet</button>' +
        '<button type="button" class="btn btn--accent" data-confirm="' + esc(inst.id) + '">Yes, choose them<span class="btn__icon" aria-hidden="true">' + icon('i-arrow') + '</span></button>' +
      '</div></form>';
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
  }

  function confirmChoose(id, btn) {
    var done = function () {
      app.chosenInstallerId = id;
      app.status = 'installer_chosen';
      if (exampleMode) { try { sessionStorage.setItem('hb-example-choice', id); } catch (e) {} }
      if (dialog.close) dialog.close(); else dialog.removeAttribute('open');
      showCompare = false;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    if (exampleMode) { done(); return; }
    btn.disabled = true;
    fetch(API + 'choose_installer.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingId: app.trackingId, installerId: id })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.success) done();
      else throw new Error((d && d.message) || '');
    }).catch(function (e) {
      btn.disabled = false;
      var err = document.getElementById('tr-dialog-error');
      err.textContent = e.message || 'We couldn\'t confirm your choice right now. Please try again, or email hi@heliobond.com.';
      err.hidden = false;
    });
  }

  /* ---------- Events ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button');
    if (!t) return;
    if (t.hasAttribute('data-choose')) { openChoose(t.getAttribute('data-choose')); return; }
    if (t.hasAttribute('data-confirm')) { confirmChoose(t.getAttribute('data-confirm'), t); return; }
    if (t.getAttribute('data-action') === 'compare') {
      showCompare = !showCompare;
      var table = document.getElementById('tr-compare');
      table.hidden = !showCompare;
      t.setAttribute('aria-expanded', showCompare);
      t.firstChild.textContent = showCompare ? 'Hide comparison' : 'Compare all ' + app.installers.length + ' quotes side by side';
      if (showCompare) table.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (t.hasAttribute('data-preview')) {
      app.status = t.getAttribute('data-preview');
      if (app.status === 'installer_chosen' && !app.chosenInstallerId) app.chosenInstallerId = recommended().id;
      if (app.status !== 'installer_chosen') { app.chosenInstallerId = null; try { sessionStorage.removeItem('hb-example-choice'); } catch (e2) {} }
      render();
      return;
    }
    if (t.hasAttribute('data-copy')) {
      var label = t.querySelector('span'), v = t.getAttribute('data-copy');
      if (navigator.clipboard) navigator.clipboard.writeText(v).then(function () {
        label.textContent = 'Copied'; t.classList.add('is-copied');
        setTimeout(function () { label.textContent = 'Copy'; t.classList.remove('is-copied'); }, 2000);
      }, function () {});
    }
  });
  if (dialog) dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });

  /* ---------- Start ---------- */
  if (exampleMode) {
    app = JSON.parse(JSON.stringify(EXAMPLE));
    var st = params.get('status');
    if (st && /^(matching|quotes_ready|installer_chosen)$/.test(st)) app.status = st;
    var saved = null;
    try { saved = sessionStorage.getItem('hb-example-choice'); } catch (e) {}
    if (app.status === 'installer_chosen' || (saved && !st)) { app.chosenInstallerId = saved || recommended().id; app.status = 'installer_chosen'; }
    render();
    return;
  }

  var id = (params.get('id') || '').trim().toUpperCase();
  if (!id) { renderLookup(); return; }
  root.innerHTML = '<div class="tr-wrap"><p class="tr-loading">Finding application ' + esc(id) + '…</p></div>';
  fetch(API + 'track.php?id=' + encodeURIComponent(id), { headers: { Accept: 'application/json' } })
    .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
    .then(function (d) {
      if (!d || !d.trackingId) throw new Error('missing');
      app = d;
      render();
    })
    .catch(function () {
      renderLookup('We couldn\'t load application ' + id + ' right now. Check the ID and try again. If you only just submitted, it can take a little while to appear.');
    });
})();
