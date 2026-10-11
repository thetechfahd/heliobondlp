/* Heliobond — "Get My Free Quotes" request form.
   Runs on its own page (get-quotes.html, #quote-modal has data-mode="page")
   or as a popup opened by [data-quote] elements.
   A step-by-step request form that sends leads to the Heliobond quote API
   (the same endpoints used by solar.heliobond.com). Any link or button with
   [data-quote] opens it; without JavaScript those links fall back to
   solar.heliobond.com. */
(function () {
  'use strict';

  var API = 'https://solar.heliobond.com/api/';
  var SOURCE = 'landing-page';

  /* ---------- Options (homes only) ---------- */
  var ZONES = {
    'North Central': ['Benue', 'FCT Abuja', 'Kogi', 'Kwara', 'Nasarawa', 'Niger', 'Plateau'],
    'North East': ['Adamawa', 'Bauchi', 'Borno', 'Gombe', 'Taraba', 'Yobe'],
    'North West': ['Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Sokoto', 'Zamfara'],
    'South East': ['Abia', 'Anambra', 'Ebonyi', 'Enugu', 'Imo'],
    'South South': ['Akwa Ibom', 'Bayelsa', 'Cross River', 'Delta', 'Edo', 'Rivers'],
    'South West': ['Ekiti', 'Lagos', 'Ogun', 'Ondo', 'Osun', 'Oyo']
  };
  var PROPERTY_TYPES = [
    'Residential (1 Bedroom Apartment)', 'Residential (2 Bedroom Apartment)',
    'Residential (3 Bedroom Apartment)', 'Residential (4 Bedroom Apartment)',
    'Residential Duplex', 'Residential Bungalow',
    'Residential Estate / Multiple Apartments',
    'Residential Property with More Bedrooms Than Listed'
  ];
  var ELECTRICITY_SOURCES = [
    'Generator (Petrol)', 'Generator (Diesel)', 'PHCN / Grid Power',
    'Generator + PHCN', 'Already have solar but need upgrade'
  ];
  var SPEND_OPTIONS = [
    "I don't spend on fuel or maintenance", 'Under ₦50,000',
    '₦50,000 – ₦150,000', '₦150,000 – ₦300,000',
    '₦300,000 – ₦700,000', '₦700,000 – ₦1M+'
  ];
  var GENERATOR_SIZES = [
    '2–3 KVA', '5 KVA', '7.5 KVA', '10 KVA', '15 KVA', '20 KVA+',
    'Not sure', "I don't currently use a generator"
  ];
  var DECISION_ROLES = [
    'Yes, I will be making the final decision',
    'I will recommend it to the decision maker',
    'I am deciding with the decision maker',
    'I am just researching for now'
  ];
  var KVA_OPTIONS = [
    { label: '3.5 kVA', value: '3.5', price: 'From ₦3.1M' },
    { label: '5 kVA', value: '5', price: 'From ₦4.7M' },
    { label: '7.5 kVA', value: '7.5', price: 'From ₦6.9M' },
    { label: '10 kVA', value: '10', price: 'From ₦9.8M' },
    { label: '15 kVA', value: '15', price: 'From ₦15.5M' },
    { label: '20 kVA', value: '20', price: 'From ₦20.9M' },
    { label: '25 kVA', value: '25', price: 'From ₦27.5M' },
    { label: '30 kVA', value: '30', price: 'From ₦31M' },
    { label: "I can afford one but don't know the best option to pick", value: 'unsure', price: '' },
    { label: "I can't afford any of these", value: 'none', price: '' }
  ];
  var SYSTEM_TIERS = [
    { value: 'tier1', label: 'Tier 1: Premium', badge: 'Best quality', tone: 'green', warranty: '5–10 year warranty',
      desc: 'Grade 1 panels, inverter and batteries. Highest quality with the longest warranties.' },
    { value: 'tier2', label: 'Tier 2: Standard', badge: 'Most popular', tone: 'blue', warranty: '3–5 year warranty',
      desc: 'Grade 2 panels, inverter and batteries. Good quality at a moderate price.' },
    { value: 'tier3', label: 'Tier 3: Budget', badge: 'Lowest cost', tone: 'orange', warranty: 'Under 2 year warranty',
      desc: 'Entry-level panels, inverter and batteries. Lowest cost, shorter warranty.' }
  ];
  var BUDGET_BANDS = {
    '3.5': ['₦3.1M – ₦3.9M', 'Above ₦4M'], '5': ['₦4.7M – ₦5.5M', 'Above ₦5.5M'],
    '7.5': ['₦6.9M – ₦7.8M', 'Above ₦7.8M'], '10': ['₦9.8M – ₦10.8M', 'Above ₦10.8M'],
    '15': ['₦15.5M – ₦17M', 'Above ₦17M'], '20': ['₦20.9M – ₦23M', 'Above ₦23M'],
    '25': ['₦27.5M – ₦30M', 'Above ₦30M'], '30': ['₦31M – ₦34M', 'Above ₦34M']
  };
  var NOT_READY = 'Not ready for this investment yet';
  var ABOVE_PLAN = "This is above what I'm planning to spend";
  var TIMELINE_OPTIONS = ['Immediately', 'In 14 days', 'In 1 month', 'In 2 months', 'In 3 months', 'Not sure yet'];
  var TITLES = ['Mr', 'Mrs', 'Miss', 'Dr', 'Prof'];
  var OWNERSHIP_OPTIONS = [
    { value: 'Owner', label: 'I own it' },
    { value: 'Family house', label: 'It belongs to my family' },
    { value: 'Renting', label: 'I rent it', sub: "We'll check with you that your landlord is happy for panels to be installed." }
  ];
  var SHADE_OPTIONS = [
    { value: 'No shade', label: 'No, the roof gets sun for most of the day' },
    { value: 'Some shade', label: 'Yes, part of the roof is shaded for some of the day' },
    { value: 'Heavy shade', label: 'Yes, the roof is in shade for most of the day' },
    { value: 'Not sure', label: "I'm not sure" }
  ];

  /* ---------- Appliance load calculator ----------
     Typical ratings for Nigerian homes. "night" is the default number of
     hours each one runs at night (or without sun or grid power). */
  var APPLIANCES = [
    { id: 'bulb', group: 'Lighting', name: 'LED bulb', watts: 10, night: 6 },
    { id: 'security', group: 'Lighting', name: 'Security / outdoor light', watts: 30, night: 12 },
    { id: 'ceilingfan', group: 'Cooling', name: 'Ceiling fan', watts: 75, night: 8 },
    { id: 'standfan', group: 'Cooling', name: 'Standing / table fan', watts: 60, night: 8 },
    { id: 'ac1', group: 'Cooling', name: 'Air conditioner (1 HP)', watts: 900, night: 6 },
    { id: 'ac15', group: 'Cooling', name: 'Air conditioner (1.5 HP)', watts: 1300, night: 6 },
    { id: 'ac2', group: 'Cooling', name: 'Air conditioner (2 HP)', watts: 1800, night: 6 },
    { id: 'fridge', group: 'Kitchen', name: 'Refrigerator', watts: 150, night: 12 },
    { id: 'freezer', group: 'Kitchen', name: 'Chest / deep freezer', watts: 200, night: 12 },
    { id: 'microwave', group: 'Kitchen', name: 'Microwave', watts: 1200, night: 0 },
    { id: 'kettle', group: 'Kitchen', name: 'Electric kettle', watts: 1500, night: 0 },
    { id: 'blender', group: 'Kitchen', name: 'Blender', watts: 400, night: 0 },
    { id: 'tv', group: 'Entertainment & work', name: 'LED TV', watts: 100, night: 4 },
    { id: 'decoder', group: 'Entertainment & work', name: 'Decoder (DStv / GOtv)', watts: 25, night: 4 },
    { id: 'sound', group: 'Entertainment & work', name: 'Sound system', watts: 100, night: 2 },
    { id: 'router', group: 'Entertainment & work', name: 'Wi-Fi router', watts: 15, night: 12 },
    { id: 'laptop', group: 'Entertainment & work', name: 'Laptop', watts: 65, night: 3 },
    { id: 'desktop', group: 'Entertainment & work', name: 'Desktop computer', watts: 200, night: 3 },
    { id: 'charger', group: 'Entertainment & work', name: 'Phone charger', watts: 10, night: 2 },
    { id: 'iron', group: 'Household', name: 'Pressing iron', watts: 1000, night: 0 },
    { id: 'washer', group: 'Household', name: 'Washing machine', watts: 500, night: 0 },
    { id: 'pump', group: 'Household', name: 'Water pump (1 HP)', watts: 750, night: 0 },
    { id: 'cctv', group: 'Household', name: 'CCTV / security system', watts: 40, night: 12 }
  ];
  var NIGHT_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  var KVA_SIZES = [3.5, 5, 7.5, 10, 15, 20, 25, 30];
  function appliance(id) { return APPLIANCES.filter(function (x) { return x.id === id; })[0]; }

  /* Projection only; the installer confirms the real size during the audit.
     - Inverter: total load if everything runs at once / 0.8 power factor,
       plus 25% headroom for motor start-up surges, rounded up to the next
       standard size.
     - Battery: energy used at night / 80% usable depth of discharge /
       90% inverter efficiency, rounded up to the next 2.5 kWh.
     - Spend: the "From" price for that inverter size (KVA_OPTIONS). */
  function sizing() {
    var watts = 0, nightWh = 0, items = [];
    form.appliances.forEach(function (row) {
      var a = appliance(row.id);
      var w = a.watts * row.qty;
      watts += w;
      nightWh += w * row.night;
      items.push(row.qty + ' x ' + a.name + ' (' + a.watts + 'W, ' + row.night + 'h at night)');
    });
    var kvaNeeded = watts / 1000 / 0.8 * 1.25;
    var kva = null;
    for (var i = 0; i < KVA_SIZES.length; i++) { if (KVA_SIZES[i] >= kvaNeeded) { kva = KVA_SIZES[i]; break; } }
    var kvaStr = watts ? (kva === null ? '30+' : String(kva)) : '';
    var batteryRaw = nightWh / 1000 / 0.8 / 0.9;
    var price = kvaStr === '30+' ? 'Above ₦31M' : ((KVA_OPTIONS.filter(function (o) { return o.value === kvaStr; })[0] || {}).price || '');
    return {
      watts: watts, nightKwh: Math.round(nightWh / 100) / 10, kva: kvaStr,
      batteryKwh: batteryRaw ? Math.ceil(batteryRaw / 2.5) * 2.5 : 0,
      spend: price, items: items
    };
  }
  function fmtKva(v) { return v === '30+' ? 'Over 30 kVA' : v + ' kVA'; }

  var META = {
    zone: ['i-pin', "Let's find installers near you", 'We use your zone to match you with COREN-accredited installers in your area.'],
    state: ['i-pin', 'Which state are you in?', 'We match you with installers who work in your state, for faster responses and easier site visits.'],
    property: ['i-house', 'What type of home is it?', 'Choose the option that best describes the home. This helps us understand the size of the installation.'],
    ownership: ['i-house', 'Do you own this home or rent it?', 'Installers need the owner\'s go-ahead before fixing panels to a roof.'],
    shading: ['i-sun', 'Does anything block the sun from your roof?', 'For example, a tall tree, a taller building next door or a water tank that casts a shadow on the roof. Panels need direct sunlight to work well.'],
    power: ['i-bolt', 'How do you power your home today?', 'This helps size and price the right solar system for you.'],
    spend: ['i-wallet', 'What do you spend on fuel and maintenance each week?', 'We use this to show how quickly solar can pay for itself.'],
    generator: ['i-bolt', 'What size is your generator?', 'It tells us your current power demand, so we can recommend the right capacity.'],
    decision: ['i-handshake', 'Are you making the decision?', "So we can prepare the right level of detail, whether that's a full proposal or a quick overview."],
    appliances: ['i-house', 'Which appliances do you want to power?', 'Pick an appliance, set how many and how long it runs at night, then add it. Repeat until your list is complete.'],
    kva: ['i-bolt', 'Choose your system size', 'Not sure? Your installer will confirm the best size during the free home audit.'],
    tier: ['i-badge', 'What quality of system do you want?', 'Your installer will explain each option in detail during the free audit.'],
    budget: ['i-wallet', "What's your investment range?", 'This helps your installer prepare an accurate proposal.'],
    budgetInput: ['i-wallet', 'What is your actual budget?', "No problem. Tell us your budget and we'll reach out when a suitable option is available."],
    timeline: ['i-calendar', 'When would you like to go solar?', 'This helps us prioritise your request and match you with an available installer.'],
    consent: ['i-handshake', 'Ready to be matched?', 'Only your project details are shared. Your contact details go only to the installer you choose.'],
    contact: ['i-phone', "Almost there, you're one step away", 'We will send your Application ID to your WhatsApp to verify your request.'],
    otp: ['i-shield', 'Enter your Application ID', 'We sent it to your WhatsApp number. Enter it to confirm your request.']
  };

  /* ---------- State ---------- */
  var form, current, busy, error, lastFocus;
  function reset() {
    form = {
      zone: '', state: '', propertyType: '', propertyTypes: [], otherProperty: '', ownership: '', roofShade: '',
      electricitySource: '', weeklySpend: '', generatorSize: '', decisionRole: '',
      kva: '', systemTier: '', budgetRange: '', budgetInput: '',
      timeline: '', consent: '', title: '', firstName: '', lastName: '', phone: '', otp: '',
      appliances: [], draft: { id: '', qty: 1, night: 0 }
    };
    current = 'zone'; busy = false; error = '';
  }

  function budgetOptions() {
    var bands = BUDGET_BANDS[form.kva] || [];
    return bands.concat([NOT_READY, ABOVE_PLAN]);
  }
  function kvaOut() { return form.kva === 'none' || form.kva === 'unsure'; }
  function budgetOut() { return form.budgetRange === NOT_READY || form.budgetRange === ABOVE_PLAN; }
  function disqualified() { return kvaOut() || budgetOut(); }
  function usesGenerator() { return /generator/i.test(form.electricitySource); }

  // The ordered list of steps for the answers given so far.
  function path() {
    var p = ['zone', 'state', 'property', 'ownership', 'shading', 'power', 'spend'];
    if (usesGenerator()) p.push('generator');
    p.push('decision', 'appliances', 'kva');
    if (!kvaOut()) {
      p.push('tier', 'budget');
      if (form.budgetRange === ABOVE_PLAN) p.push('budgetInput');
    }
    p.push('timeline', 'consent', 'contact', 'otp');
    return p;
  }

  function canNext(step) {
    var f = form;
    switch (step) {
      case 'budgetInput': return f.budgetInput.trim() !== '' && !isNaN(parseFloat(f.budgetInput));
      case 'contact': return !!f.title && f.firstName.trim() && f.lastName.trim() && f.phone.replace(/\D/g, '').length >= 9;
      case 'otp': return f.otp.trim().length === 6;
      default: return true;
    }
  }

  function go(step) { current = step; error = ''; render(true); }
  function next() {
    var p = path(); var i = p.indexOf(current);
    if (i > -1 && i < p.length - 1) go(p[i + 1]);
  }
  function back() {
    var p = path(); var i = p.indexOf(current);
    if (i > 0) go(p[i - 1]);
  }

  /* ---------- API ---------- */
  function post(endpoint, body) {
    return fetch(API + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); });
  }

  function sendOtp() {
    if (!canNext('contact') || busy) return;
    busy = true; error = ''; render();
    post('send_otp.php', { phone: form.phone.trim() }).then(function (data) {
      busy = false;
      if (!data || !data.success) { error = (data && data.message) || 'Could not send your Application ID. Please try again.'; render(); return; }
      if (data.otp_disabled) { form.otp = '000000'; submit(); return; }
      go('otp');
    }).catch(function () {
      busy = false; error = 'Could not reach the server. Please check your connection and try again.'; render();
    });
  }

  function submit() {
    if (busy && form.otp !== '000000') return;
    busy = true; error = ''; render();
    var f = form;
    var loadSummary = sizing();
    post('submit.php', {
      title: f.title, firstName: f.firstName.trim(), lastName: f.lastName.trim(),
      phone: f.phone.trim(), otp: f.otp.trim(),
      zone: f.zone, state: f.state,
      propertyTypes: f.propertyTypes, otherProperty: f.otherProperty,
      ownership: f.ownership, roofShade: f.roofShade,
      electricitySource: f.electricitySource, weeklySpend: f.weeklySpend,
      generatorSize: f.generatorSize, decisionRole: f.decisionRole,
      kva: f.kva, systemTier: f.systemTier,
      budgetRange: f.budgetRange, budgetInput: f.budgetInput,
      timeline: f.timeline, consent: f.consent,
      disqualified: disqualified(),
      appliances: loadSummary.items,
      loadWatts: loadSummary.watts,
      nightKwh: loadSummary.nightKwh,
      projectedSpend: loadSummary.spend,
      recommendedKva: loadSummary.kva,
      recommendedBatteryKwh: loadSummary.batteryKwh,
      source: SOURCE
    }).then(function (data) {
      busy = false;
      if (data && data.success) {
        var held = disqualified() || form.consent === 'no';
        try {
          sessionStorage.setItem('hb-quote', JSON.stringify({
            name: form.firstName.trim(), state: form.state, held: held,
            kva: loadSummary.kva, batteryKwh: loadSummary.batteryKwh, spend: loadSummary.spend
          }));
        } catch (e) {}
        window.location.href = 'thank-you.html' + (held ? '?status=saved' : '');
        return;
      }
      error = (data && data.message) || 'Something went wrong. Please try again.'; render();
    }).catch(function () {
      busy = false; error = 'Network error. Please check your connection and try again.'; render();
    });
  }

  /* ---------- Rendering ---------- */
  var modal, body, progressBar, progressText, pageMode;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function icon(id, cls) { return '<svg class="' + (cls || '') + '" aria-hidden="true"><use href="#' + id + '"/></svg>'; }
  var ARROW = icon('i-arrow');

  function choice(field, options, opts) {
    opts = opts || {};
    return '<div class="qm-options' + (opts.grid ? ' qm-options--grid' : '') + '">' + options.map(function (o) {
      // Strings have built-in methods called sub() etc., so only read extras from objects.
      var obj = typeof o === 'object' ? o : {};
      var value = typeof o === 'string' ? o : o.value;
      var label = typeof o === 'string' ? o : o.label;
      var on = form[field] === value;
      return '<button type="button" class="qm-option' + (on ? ' is-selected' : '') + '" aria-pressed="' + on + '" data-set="' + field + '" data-value="' + esc(value) + '">' +
        '<span class="qm-option__label">' + esc(label) + '</span>' +
        (opts.recommended && value === opts.recommended ? '<span class="qm-badge qm-badge--green">Recommended</span>' : '') +
        (obj.price ? '<span class="qm-option__meta">' + esc(obj.price) + '</span>' : '') +
        (obj.sub ? '<span class="qm-option__sub">' + esc(obj.sub) + '</span>' : '') +
        '</button>';
    }).join('') + '</div>';
  }
  function primary(label, action, disabled) {
    return '<button type="button" class="btn btn--accent qm-primary" data-action="' + action + '"' + (disabled ? ' disabled' : '') + '>' +
      esc(label) + '<span class="btn__icon" aria-hidden="true">' + ARROW + '</span></button>';
  }
  function backBtn(label) { return '<button type="button" class="qm-back" data-action="back">← ' + esc(label || 'Back') + '</button>'; }
  function errorBox() { return error ? '<p class="qm-error" role="alert">' + esc(error) + '</p>' : ''; }

  function stepHtml(step) {
    var f = form;
    switch (step) {
      case 'zone':
        return '<div class="qm-zones">' + Object.keys(ZONES).map(function (z) {
          var on = f.zone === z;
          return '<button type="button" class="qm-zone' + (on ? ' is-selected' : '') + '" aria-pressed="' + on + '" data-set="zone" data-value="' + esc(z) + '">' +
            '<span class="qm-zone__name">' + esc(z) + '</span><span class="qm-zone__states">' + esc(ZONES[z].join(' · ')) + '</span></button>';
        }).join('') + '</div>';
      case 'state': return choice('state', ZONES[f.zone] || [], { grid: true }) + backBtn();
      case 'property':
        return choice('propertyType', PROPERTY_TYPES.map(function (t) {
          return { value: t, label: t.replace(/^Residential\s*/, '').replace(/^\((.*)\)$/, '$1') };
        }), { grid: true }) + backBtn();
      case 'ownership': return choice('ownership', OWNERSHIP_OPTIONS) + backBtn();
      case 'shading': return choice('roofShade', SHADE_OPTIONS) + backBtn();
      case 'power': return choice('electricitySource', ELECTRICITY_SOURCES) + backBtn();
      case 'spend': return choice('weeklySpend', SPEND_OPTIONS) + backBtn();
      case 'generator': return choice('generatorSize', GENERATOR_SIZES, { grid: true }) + backBtn();
      case 'decision': return choice('decisionRole', DECISION_ROLES) + backBtn();
      case 'kva':
        var rec = sizing();
        var recNote = rec.kva
          ? '<p class="qm-note qm-note--ok">' + icon('i-check') + '<span>Based on your appliances, we recommend about <strong>' + esc(fmtKva(rec.kva)) + '</strong> with a <strong>' + esc(rec.batteryKwh) + ' kWh</strong> battery.</span></p>'
          : '';
        return recNote + choice('kva', KVA_OPTIONS, { recommended: rec.kva }) + backBtn();
      case 'appliances':
        var sz = sizing(), d = f.draft, groups = {}, order = [];
        APPLIANCES.forEach(function (x) { if (!groups[x.group]) { groups[x.group] = []; order.push(x.group); } groups[x.group].push(x); });
        var picker = '<div class="qm-picker">' +
          '<label class="qm-label" for="qm-appl">Appliance</label>' +
          '<select id="qm-appl" class="qm-input qm-select" data-draft="id"><option value="">Select an appliance…</option>' +
          order.map(function (g) {
            return '<optgroup label="' + esc(g) + '">' + groups[g].map(function (x) {
              return '<option value="' + x.id + '"' + (d.id === x.id ? ' selected' : '') + '>' + esc(x.name) + ' (' + x.watts + ' W)</option>';
            }).join('') + '</optgroup>';
          }).join('') + '</select>' +
          '<div class="qm-row">' +
            '<div><p class="qm-label" id="qm-qty-label">How many?</p><div class="qm-stepper qm-stepper--lg" role="group" aria-labelledby="qm-qty-label">' +
              '<button type="button" data-draftqty="-1" aria-label="One fewer"' + (d.qty > 1 ? '' : ' disabled') + '>−</button>' +
              '<span aria-live="polite">' + d.qty + '</span>' +
              '<button type="button" data-draftqty="1" aria-label="One more">+</button></div></div>' +
            '<div><label class="qm-label" for="qm-night">Hours used at night</label>' +
              '<select id="qm-night" class="qm-input qm-select" data-draft="night">' + NIGHT_OPTIONS.map(function (h) {
                return '<option value="' + h + '"' + (h === d.night ? ' selected' : '') + '>' + (h === 0 ? 'Not at night' : h + (h === 1 ? ' hour' : ' hours')) + '</option>';
              }).join('') + '</select></div>' +
          '</div>' +
          '<button type="button" class="btn btn--dark qm-add" data-action="addAppliance"' + (d.id ? '' : ' disabled') + '>+ Add to my list</button>' +
          '</div>';
        var list = f.appliances.length
          ? '<p class="qm-group">Your appliances (' + f.appliances.length + ')</p><ul class="qm-list">' + f.appliances.map(function (row, i) {
              var x = appliance(row.id);
              return '<li class="qm-list__item"><span class="qm-list__qty">' + row.qty + '×</span>' +
                '<span class="qm-list__info"><strong>' + esc(x.name) + '</strong><span>' + x.watts + ' W each · ' +
                (row.night ? row.night + (row.night === 1 ? ' hour' : ' hours') + ' at night' : 'not used at night') + '</span></span>' +
                '<button type="button" class="qm-list__remove" data-remove="' + i + '" aria-label="Remove ' + esc(x.name) + '">' + icon('i-x') + '</button></li>';
            }).join('') + '</ul>'
          : '<p class="qm-empty">No appliances added yet. Start with the ones you most want to keep running, like lights, fans and your fridge.</p>';
        var summary = '<div class="qm-calc qm-calc--3" aria-live="polite">' +
          '<div class="qm-calc__hl"><span>Suggested inverter</span><strong>' + (sz.kva ? esc(fmtKva(sz.kva)) : '–') + '</strong></div>' +
          '<div class="qm-calc__hl"><span>Suggested battery</span><strong>' + (sz.batteryKwh ? sz.batteryKwh + ' kWh' : (sz.watts ? 'Not needed' : '–')) + '</strong></div>' +
          '<div class="qm-calc__hl"><span>Projected spend</span><strong>' + (sz.spend ? esc(sz.spend) : '–') + '</strong></div>' +
          '</div>' +
          '<p class="qm-disclaimer">' + icon('i-shield-alert') + '<span><strong>This is only a projection</strong> based on typical appliance ratings' +
          (sz.watts ? ' (total load ' + sz.watts.toLocaleString() + ' W, ' + sz.nightKwh + ' kWh at night)' : '') +
          '. Your installer will confirm the exact system size and price during the free home audit.</span></p>';
        return picker + list + summary +
          primary('Continue', 'next', !f.appliances.length) +
          '<p class="qm-hint qm-center"><button type="button" class="qm-link" data-action="skipAppliances">Skip, I\'m not sure what I use</button></p>' + backBtn();
      case 'tier':
        return '<div class="qm-options">' + SYSTEM_TIERS.map(function (t) {
          var on = f.systemTier === t.value;
          return '<button type="button" class="qm-option qm-tier' + (on ? ' is-selected' : '') + '" aria-pressed="' + on + '" data-set="systemTier" data-value="' + t.value + '">' +
            '<span class="qm-tier__top"><span class="qm-option__label">' + esc(t.label) + '</span><span class="qm-badge qm-badge--' + t.tone + '">' + esc(t.badge) + '</span></span>' +
            '<span class="qm-tier__warranty">' + esc(t.warranty) + '</span><span class="qm-option__sub">' + esc(t.desc) + '</span></button>';
        }).join('') + '</div>' + backBtn();
      case 'budget':
        var k = KVA_OPTIONS.filter(function (o) { return o.value === f.kva; })[0];
        return '<p class="qm-note">Selected system: <strong>' + esc(k ? k.label : '') + '</strong></p>' + choice('budgetRange', budgetOptions()) + backBtn();
      case 'budgetInput':
        return '<label class="qm-label" for="qm-budget">Your budget</label>' +
          '<div class="qm-affix"><span>₦</span><input id="qm-budget" class="qm-input" type="text" inputmode="decimal" placeholder="e.g. 1.5 or 20" data-field="budgetInput" value="' + esc(f.budgetInput) + '"><span>Million</span></div>' +
          '<p class="qm-hint">Type 1.5 for ₦1.5 million, or 20 for ₦20 million.</p>' +
          primary('Continue', 'next', !canNext('budgetInput')) + backBtn();
      case 'timeline': return choice('timeline', TIMELINE_OPTIONS, { grid: true }) + backBtn();
      case 'consent':
        return choice('consent', [
          { value: 'yes', label: 'Yes, share my project details with COREN-accredited installers in my region' },
          { value: 'no', label: "Not yet. I'm still researching, but keep my details on file" }
        ]) + backBtn();
      case 'contact':
        var note = disqualified()
          ? "<p class=\"qm-note qm-note--warm\">We'll keep your project details and reach out when a suitable option becomes available.</p>"
          : (f.consent === 'no' ? "<p class=\"qm-note\">Got it. We'll keep your project details on file and reach out when you're ready.</p>" : '');
        return note +
          '<p class="qm-label" id="qm-title-label">Title</p><div class="qm-chips" role="group" aria-labelledby="qm-title-label">' + TITLES.map(function (t) {
            var on = f.title === t;
            return '<button type="button" class="qm-chip' + (on ? ' is-selected' : '') + '" aria-pressed="' + on + '" data-title="' + t + '">' + t + '</button>';
          }).join('') + '</div>' +
          '<div class="qm-row"><div><label class="qm-label" for="qm-first">First name</label><input id="qm-first" class="qm-input" type="text" autocomplete="given-name" data-field="firstName" value="' + esc(f.firstName) + '"></div>' +
          '<div><label class="qm-label" for="qm-last">Last name</label><input id="qm-last" class="qm-input" type="text" autocomplete="family-name" data-field="lastName" value="' + esc(f.lastName) + '"></div></div>' +
          '<label class="qm-label" for="qm-phone">WhatsApp number</label>' +
          '<div class="qm-affix qm-affix--phone"><span class="qm-flag" aria-hidden="true"><i></i><i></i><i></i></span><span>+234</span><input id="qm-phone" class="qm-input" type="tel" autocomplete="tel-national" placeholder="080xxxxxxxx" data-field="phone" value="' + esc(f.phone) + '"></div>' +
          '<p class="qm-hint">We will send your Application ID to this number on WhatsApp.</p>' + errorBox() +
          primary(busy ? 'Sending…' : 'Send my Application ID', 'sendOtp', !canNext('contact') || busy) + backBtn();
      case 'otp':
        return '<p class="qm-note qm-note--ok">' + icon('i-check') + 'Application ID sent to 0' + esc(f.phone.replace(/\D/g, '').slice(-10)) + ' on WhatsApp</p>' +
          '<label class="qm-label" for="qm-otp">Application ID</label>' +
          '<input id="qm-otp" class="qm-input qm-otp" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" data-field="otp" value="' + esc(f.otp) + '">' +
          errorBox() + primary(busy ? 'Submitting…' : 'Confirm and submit', 'submit', !canNext('otp') || busy) +
          '<p class="qm-hint qm-center">Didn\'t receive it? <button type="button" class="qm-link" data-action="sendOtp">Resend Application ID</button></p>' +
          backBtn('Change number');
      case 'done':
        var held = disqualified() || f.consent === 'no';
        return '<div class="qm-done">' +
          '<span class="qm-done__icon" aria-hidden="true">' + icon('i-check') + '</span>' +
          '<h2 class="qm-done__title" tabindex="-1">' + (held ? 'Thank you, ' + esc(f.firstName.trim()) + '.' : 'Request received, ' + esc(f.firstName.trim()) + '!') + '</h2>' +
          '<p>' + (held
            ? "We've saved your project details. Our team will reach out on WhatsApp when a suitable option is available."
            : "We're matching you with COREN-accredited installers in " + esc(f.state) + '. Your quotes will be sent to your WhatsApp.') + '</p>' +
          '<button type="button" class="btn btn--dark qm-primary" data-action="close">Back to the website</button></div>';
    }
    return '';
  }

  function render(stepChanged) {
    var p = path();
    var done = current === 'done';
    var i = p.indexOf(current);
    var total = p.length;
    modal.classList.toggle('is-done', done);
    progressBar.style.width = (done ? 100 : Math.round((i / total) * 100)) + '%';
    progressText.textContent = done ? 'Complete' : 'Step ' + (i + 1) + ' of ' + total;

    var head = '';
    if (!done) {
      var m = META[current];
      head = '<div class="qm-head"><span class="qm-head__icon" aria-hidden="true">' + icon(m[0]) + '</span>' +
        '<div><h2 class="qm-head__title" tabindex="-1">' + esc(m[1]) + '</h2><p class="qm-head__sub">' + esc(m[2]) + '</p></div></div>';
    }
    // Keep the caret where it is while typing.
    var active = document.activeElement;
    var activeField = active && active.getAttribute && active.getAttribute('data-field');
    var caret = activeField && active.selectionStart;

    body.innerHTML = '<div class="qm-step' + (stepChanged ? ' is-entering' : '') + '">' + head + stepHtml(current) + '</div>';
    body.scrollTop = stepChanged ? 0 : body.scrollTop;

    if (stepChanged) {
      var t = body.querySelector('.qm-head__title, .qm-done__title');
      if (t) t.focus({ preventScroll: true });
    } else if (activeField) {
      var el = body.querySelector('[data-field="' + activeField + '"]');
      if (el) { el.focus(); try { el.setSelectionRange(caret, caret); } catch (e) {} }
    }
  }

  /* ---------- Events ---------- */
  function onClick(e) {
    var t = e.target.closest('button');
    if (!t || !body.contains(t)) return;
    if (t.hasAttribute('data-set')) {
      var field = t.getAttribute('data-set'), value = t.getAttribute('data-value');
      if (field === 'zone' && form.zone !== value) form.state = '';
      if (field === 'propertyType') form.propertyTypes = [value];   // the API expects a list
      if (field === 'kva' && form.kva !== value) { form.systemTier = ''; form.budgetRange = ''; form.budgetInput = ''; }
      if (field === 'electricitySource' && !/generator/i.test(value)) form.generatorSize = '';
      form[field] = value;
      next();
      return;
    }
    if (t.hasAttribute('data-toggle')) {
      var v = t.getAttribute('data-toggle'), list = form.propertyTypes, at = list.indexOf(v);
      if (at > -1) list.splice(at, 1); else list.push(v);
      render();
      return;
    }
    if (t.hasAttribute('data-title')) { form.title = t.getAttribute('data-title'); render(); return; }
    if (t.hasAttribute('data-draftqty')) {
      form.draft.qty = Math.max(1, Math.min(50, form.draft.qty + +t.getAttribute('data-draftqty')));
      render();
      var same = body.querySelector('[data-draftqty="' + t.getAttribute('data-draftqty') + '"]');
      if (same && !same.disabled) same.focus({ preventScroll: true });
      return;
    }
    if (t.hasAttribute('data-remove')) {
      form.appliances.splice(+t.getAttribute('data-remove'), 1);
      render();
      return;
    }
    switch (t.getAttribute('data-action')) {
      case 'next': if (canNext(current)) next(); break;
      case 'back': back(); break;
      case 'sendOtp': sendOtp(); break;
      case 'submit': if (canNext('otp')) submit(); break;
      case 'close': close(); break;
      case 'skipAppliances': form.appliances = []; next(); break;
      case 'addAppliance':
        var d = form.draft;
        if (!d.id) break;
        // Adding the same appliance again updates its line instead of duplicating it.
        var existing = form.appliances.filter(function (r) { return r.id === d.id && r.night === d.night; })[0];
        if (existing) existing.qty = Math.min(50, existing.qty + d.qty);
        else form.appliances.push({ id: d.id, qty: d.qty, night: d.night });
        form.draft = { id: '', qty: 1, night: 0 };
        render();
        var sel = body.querySelector('#qm-appl');
        if (sel) sel.focus({ preventScroll: true });
        break;
    }
  }
  function onInput(e) {
    if (e.target.hasAttribute('data-draft')) {
      var key = e.target.getAttribute('data-draft');
      if (key === 'id') {
        form.draft.id = e.target.value;
        var x = appliance(e.target.value);
        if (x) form.draft.night = x.night;   // sensible default; they can change it
        render();
        var again = body.querySelector('#qm-appl');
        if (again) again.focus({ preventScroll: true });
      } else {
        form.draft.night = +e.target.value;
      }
      return;
    }
    var field = e.target.getAttribute('data-field');
    if (!field) return;
    var v = e.target.value;
    if (field === 'otp') v = v.replace(/\D/g, '').slice(0, 6);
    if (field === 'phone') v = v.replace(/[^\d+\s]/g, '');
    form[field] = v;
    // Only the primary button's enabled state depends on typing.
    var btn = body.querySelector('.qm-primary');
    if (btn) btn.disabled = !canNext(current) || busy;
    if (v !== e.target.value) e.target.value = v;
  }
  function onKey(e) {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Enter' && e.target.matches && e.target.matches('.qm-input')) {
      e.preventDefault();
      var btn = body.querySelector('.qm-primary');
      if (btn && !btn.disabled) btn.click();
      return;
    }
    if (e.key === 'Tab') {
      // Keep focus inside the dialog.
      var f = modal.querySelectorAll('button:not([disabled]), input, [tabindex="-1"]');
      var list = Array.prototype.filter.call(f, function (el) { return el.offsetParent !== null && el.tabIndex !== -1; });
      if (!list.length) return;
      var first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function open() {
    if (current === 'done') reset();
    lastFocus = document.activeElement;
    modal.hidden = false;
    // Allow the display change to apply before animating in.
    requestAnimationFrame(function () { modal.classList.add('is-open'); });
    document.documentElement.classList.add('qm-open');
    render(true);
  }
  function close() {
    if (pageMode) { window.location.href = 'index.html'; return; }
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('qm-open');
    setTimeout(function () { modal.hidden = true; }, 200);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    if (location.hash === '#get-quotes') history.replaceState(null, '', location.pathname + location.search);
  }

  function init() {
    modal = document.getElementById('quote-modal');
    if (!modal || !window.fetch) return;
    body = modal.querySelector('.qm-body');
    progressBar = modal.querySelector('.qm-progress__bar');
    progressText = modal.querySelector('.qm-progress__text');
    reset();
    pageMode = modal.getAttribute('data-mode') === 'page';

    if (pageMode) {
      modal.addEventListener('click', function (e) {
        if (e.target.closest('.qm-close')) { e.preventDefault(); close(); return; }
        onClick(e);
      });
      body.addEventListener('input', onInput);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target.matches && e.target.matches('.qm-input')) {
          e.preventDefault();
          var btn = body.querySelector('.qm-primary');
          if (btn && !btn.disabled) btn.click();
        }
      });
      render(false);
      return;
    }

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-quote]');
      if (trigger) { e.preventDefault(); open(); }
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.closest('.qm-close')) { close(); return; }
      onClick(e);
    });
    body.addEventListener('input', onInput);
    document.addEventListener('keydown', onKey);

    if (location.hash === '#get-quotes') open();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
