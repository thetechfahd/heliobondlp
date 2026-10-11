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

  /* ---------- Appliance load calculator ----------
     Typical ratings for Nigerian homes. "hours" is the default daily use. */
  var APPLIANCES = [
    { id: 'bulb', group: 'Lighting', name: 'LED bulb', watts: 10, hours: 6 },
    { id: 'security', group: 'Lighting', name: 'Security / outdoor light', watts: 30, hours: 12 },
    { id: 'ceilingfan', group: 'Cooling', name: 'Ceiling fan', watts: 75, hours: 8 },
    { id: 'standfan', group: 'Cooling', name: 'Standing / table fan', watts: 60, hours: 8 },
    { id: 'ac1', group: 'Cooling', name: 'Air conditioner (1 HP)', watts: 900, hours: 6 },
    { id: 'ac15', group: 'Cooling', name: 'Air conditioner (1.5 HP)', watts: 1300, hours: 6 },
    { id: 'ac2', group: 'Cooling', name: 'Air conditioner (2 HP)', watts: 1800, hours: 6 },
    { id: 'fridge', group: 'Kitchen', name: 'Refrigerator', watts: 150, hours: 12 },
    { id: 'freezer', group: 'Kitchen', name: 'Chest / deep freezer', watts: 200, hours: 12 },
    { id: 'microwave', group: 'Kitchen', name: 'Microwave', watts: 1200, hours: 1 },
    { id: 'kettle', group: 'Kitchen', name: 'Electric kettle', watts: 1500, hours: 1 },
    { id: 'blender', group: 'Kitchen', name: 'Blender', watts: 400, hours: 1 },
    { id: 'tv', group: 'Entertainment & work', name: 'LED TV', watts: 100, hours: 6 },
    { id: 'decoder', group: 'Entertainment & work', name: 'Decoder (DStv / GOtv)', watts: 25, hours: 6 },
    { id: 'sound', group: 'Entertainment & work', name: 'Sound system', watts: 100, hours: 3 },
    { id: 'router', group: 'Entertainment & work', name: 'Wi-Fi router', watts: 15, hours: 24 },
    { id: 'laptop', group: 'Entertainment & work', name: 'Laptop', watts: 65, hours: 6 },
    { id: 'desktop', group: 'Entertainment & work', name: 'Desktop computer', watts: 200, hours: 6 },
    { id: 'charger', group: 'Entertainment & work', name: 'Phone charger', watts: 10, hours: 3 },
    { id: 'iron', group: 'Household', name: 'Pressing iron', watts: 1000, hours: 1 },
    { id: 'washer', group: 'Household', name: 'Washing machine', watts: 500, hours: 1 },
    { id: 'pump', group: 'Household', name: 'Water pump (1 HP)', watts: 750, hours: 1 },
    { id: 'cctv', group: 'Household', name: 'CCTV / security system', watts: 40, hours: 24 }
  ];
  var HOUR_OPTIONS = [1, 2, 3, 4, 6, 8, 10, 12, 16, 24];
  var BACKUP_OPTIONS = [4, 6, 8, 10, 12];
  var KVA_SIZES = [3.5, 5, 7.5, 10, 15, 20, 25, 30];

  /* Sizing assumptions (an estimate; the installer confirms during the audit):
     - Inverter: total running load / 0.8 power factor, plus 25% headroom for
       motor start-up surges, rounded up to the next standard size.
     - Battery: energy used during the backup window, divided by 80% usable
       depth of discharge and 90% inverter efficiency, rounded up to 2.5 kWh. */
  function sizing() {
    var watts = 0, daily = 0, backupWh = 0, items = [];
    var backup = form.backupHours || 8;
    APPLIANCES.forEach(function (a) {
      var row = form.appliances[a.id];
      if (!row || !row.qty) return;
      var w = a.watts * row.qty;
      watts += w;
      daily += w * row.hours;
      backupWh += w * Math.min(row.hours, backup);
      items.push(row.qty + ' x ' + a.name + ' (' + a.watts + 'W, ' + row.hours + 'h/day)');
    });
    var kvaNeeded = watts / 1000 / 0.8 * 1.25;
    var kva = null;
    for (var i = 0; i < KVA_SIZES.length; i++) { if (KVA_SIZES[i] >= kvaNeeded) { kva = KVA_SIZES[i]; break; } }
    var batteryRaw = backupWh / 1000 / 0.8 / 0.9;
    var battery = batteryRaw ? Math.ceil(batteryRaw / 2.5) * 2.5 : 0;
    return {
      watts: watts, dailyKwh: Math.round(daily / 100) / 10,
      kva: watts ? (kva === null ? '30+' : String(kva)) : '',
      batteryKwh: battery, items: items, backupHours: backup
    };
  }
  function fmtKva(v) { return v === '30+' ? 'Over 30 kVA' : v + ' kVA'; }

  var META = {
    zone: ['i-pin', "Let's find installers near you", 'We use your zone to match you with COREN-accredited installers in your area.'],
    state: ['i-pin', 'Which state are you in?', 'We match you with installers who work in your state, for faster responses and easier site visits.'],
    property: ['i-house', 'What type of home is it?', 'Select all that apply. This helps us understand the size of the installation.'],
    power: ['i-bolt', 'How do you power your home today?', 'This helps size and price the right solar system for you.'],
    spend: ['i-wallet', 'What do you spend on fuel and maintenance each week?', 'We use this to show how quickly solar can pay for itself.'],
    generator: ['i-bolt', 'What size is your generator?', 'It tells us your current power demand, so we can recommend the right capacity.'],
    decision: ['i-handshake', 'Are you making the decision?', "So we can prepare the right level of detail, whether that's a full proposal or a quick overview."],
    appliances: ['i-house', 'Which appliances do you want to power?', 'Add each appliance and how many you have. We will work out the inverter and battery size your home needs.'],
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
      zone: '', state: '', propertyTypes: [], otherProperty: '',
      electricitySource: '', weeklySpend: '', generatorSize: '', decisionRole: '',
      kva: '', systemTier: '', budgetRange: '', budgetInput: '',
      timeline: '', consent: '', title: '', firstName: '', lastName: '', phone: '', otp: '',
      appliances: {}, backupHours: 8
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
    var p = ['zone', 'state', 'property', 'power', 'spend'];
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
      case 'property': return f.propertyTypes.length > 0;
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
      electricitySource: f.electricitySource, weeklySpend: f.weeklySpend,
      generatorSize: f.generatorSize, decisionRole: f.decisionRole,
      kva: f.kva, systemTier: f.systemTier,
      budgetRange: f.budgetRange, budgetInput: f.budgetInput,
      timeline: f.timeline, consent: f.consent,
      disqualified: disqualified(),
      appliances: loadSummary.items,
      loadWatts: loadSummary.watts,
      dailyKwh: loadSummary.dailyKwh,
      backupHours: loadSummary.backupHours,
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
            kva: loadSummary.kva, batteryKwh: loadSummary.batteryKwh, dailyKwh: loadSummary.dailyKwh
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
        return '<div class="qm-options qm-options--grid">' + PROPERTY_TYPES.map(function (t) {
          var on = f.propertyTypes.indexOf(t) > -1;
          return '<button type="button" class="qm-option qm-option--check' + (on ? ' is-selected' : '') + '" aria-pressed="' + on + '" data-toggle="' + esc(t) + '">' +
            '<span class="qm-check" aria-hidden="true">' + icon('i-check') + '</span><span class="qm-option__label">' + esc(t.replace(/^Residential\s*/, '').replace(/^\((.*)\)$/, '$1')) + '</span></button>';
        }).join('') + '</div>' + primary('Continue', 'next', !canNext('property')) + backBtn();
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
        var sz = sizing(), groups = {}, order = [];
        APPLIANCES.forEach(function (a) { if (!groups[a.group]) { groups[a.group] = []; order.push(a.group); } groups[a.group].push(a); });
        var list = order.map(function (g) {
          return '<p class="qm-group">' + esc(g) + '</p><ul class="qm-appliances">' + groups[g].map(function (a) {
            var row = f.appliances[a.id] || { qty: 0, hours: a.hours };
            var on = row.qty > 0;
            return '<li class="qm-appl' + (on ? ' is-on' : '') + '">' +
              '<div class="qm-appl__info"><span class="qm-appl__name">' + esc(a.name) + '</span><span class="qm-appl__rating">' + a.watts + ' W</span></div>' +
              '<div class="qm-stepper" role="group" aria-label="' + esc(a.name) + ' quantity">' +
                '<button type="button" data-qty="' + a.id + '" data-delta="-1" data-key="m-' + a.id + '" aria-label="Remove one ' + esc(a.name) + '"' + (on ? '' : ' disabled') + '>−</button>' +
                '<span aria-live="polite">' + row.qty + '</span>' +
                '<button type="button" data-qty="' + a.id + '" data-delta="1" data-key="p-' + a.id + '" aria-label="Add one ' + esc(a.name) + '">+</button>' +
              '</div>' +
              (on ? '<label class="qm-appl__hours">Hours used per day <select data-hours="' + a.id + '">' + HOUR_OPTIONS.map(function (h) {
                return '<option value="' + h + '"' + (h === row.hours ? ' selected' : '') + '>' + h + (h === 1 ? ' hour' : ' hours') + '</option>';
              }).join('') + '</select></label>' : '') +
              '</li>';
          }).join('') + '</ul>';
        }).join('');
        var backupSel = '<label class="qm-label" for="qm-backup">How long should your battery last without sun or grid power?</label>' +
          '<select id="qm-backup" class="qm-input qm-select" data-backup>' + BACKUP_OPTIONS.map(function (h) {
            return '<option value="' + h + '"' + (h === f.backupHours ? ' selected' : '') + '>' + h + ' hours</option>';
          }).join('') + '</select>';
        var summary = '<div class="qm-calc" aria-live="polite">' +
          '<div><span>Total load</span><strong>' + (sz.watts ? sz.watts.toLocaleString() + ' W' : '–') + '</strong></div>' +
          '<div><span>Daily energy</span><strong>' + (sz.watts ? sz.dailyKwh + ' kWh' : '–') + '</strong></div>' +
          '<div class="qm-calc__hl"><span>Inverter</span><strong>' + (sz.kva ? esc(fmtKva(sz.kva)) : '–') + '</strong></div>' +
          '<div class="qm-calc__hl"><span>Battery</span><strong>' + (sz.batteryKwh ? sz.batteryKwh + ' kWh' : '–') + '</strong></div>' +
          '</div><p class="qm-hint">An estimate based on typical ratings. Your installer confirms the final size during the free home audit.</p>';
        return list + backupSel + summary +
          primary('Continue', 'next', !sz.watts) +
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
    if (t.hasAttribute('data-qty')) {
      var id = t.getAttribute('data-qty'), delta = +t.getAttribute('data-delta');
      var a = APPLIANCES.filter(function (x) { return x.id === id; })[0];
      var row = form.appliances[id] || { qty: 0, hours: a.hours };
      row.qty = Math.max(0, Math.min(50, row.qty + delta));
      form.appliances[id] = row;
      var key = t.getAttribute('data-key');
      render();
      var again = body.querySelector('[data-key="' + key + '"]');
      if (again && !again.disabled) again.focus({ preventScroll: true });
      else { var plus = body.querySelector('[data-key="p-' + id + '"]'); if (plus) plus.focus({ preventScroll: true }); }
      return;
    }
    switch (t.getAttribute('data-action')) {
      case 'next': if (canNext(current)) next(); break;
      case 'back': back(); break;
      case 'sendOtp': sendOtp(); break;
      case 'submit': if (canNext('otp')) submit(); break;
      case 'close': close(); break;
      case 'skipAppliances': form.appliances = {}; next(); break;
    }
  }
  function onInput(e) {
    if (e.target.hasAttribute('data-hours')) {
      var row = form.appliances[e.target.getAttribute('data-hours')];
      if (row) row.hours = +e.target.value;
      refreshCalc(); return;
    }
    if (e.target.hasAttribute('data-backup')) { form.backupHours = +e.target.value; refreshCalc(); return; }
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
  // Update only the totals box so the open dropdown keeps focus.
  function refreshCalc() {
    var sz = sizing(), cells = body.querySelectorAll('.qm-calc strong');
    if (cells.length !== 4) return;
    cells[0].textContent = sz.watts ? sz.watts.toLocaleString() + ' W' : '–';
    cells[1].textContent = sz.watts ? sz.dailyKwh + ' kWh' : '–';
    cells[2].textContent = sz.kva ? fmtKva(sz.kva) : '–';
    cells[3].textContent = sz.batteryKwh ? sz.batteryKwh + ' kWh' : '–';
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
