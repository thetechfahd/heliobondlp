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
  // These values are what the API stores; visitors see the instalment-led labels below.
  var NOT_READY = 'Not ready for this investment yet';
  var ABOVE_PLAN = "This is above what I'm planning to spend";
  var BUDGET_LABELS = {};
  BUDGET_LABELS[ABOVE_PLAN] = "That's above my budget. Show me instalment options";
  BUDGET_LABELS[NOT_READY] = "I'm not ready yet. Tell me how instalments work";

  /* 20% down payment, worked out from a price string such as "From ₦3.1M". */
  var DOWN_SHARE = 0.2;
  function millions(str) {
    var out = [], re = /₦([\d.]+)M/g, m;
    while ((m = re.exec(str || ''))) out.push(+m[1]);
    return out;
  }
  function naira(millionsValue) { return '₦' + Math.round(millionsValue * 1e6).toLocaleString('en-US'); }
  function downOf(str) { var m = millions(str); return m.length ? naira(m[0] * DOWN_SHARE) : ''; }
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
  // aliases: the everyday words people type, so "fridge", "AC" or "pumping machine" all find a match.
  var APPLIANCES = [
    { id: 'bulb', group: 'Lighting', name: 'LED bulb', watts: 10, night: 6, aliases: ['light', 'lamp', 'energy saver', 'bulbs'] },
    { id: 'security', group: 'Lighting', name: 'Security / outdoor light', watts: 30, night: 12, aliases: ['security light', 'flood light', 'floodlight', 'outdoor light', 'street light'] },
    { id: 'ceilingfan', group: 'Cooling', name: 'Ceiling fan', watts: 75, night: 8, aliases: ['fan'] },
    { id: 'standfan', group: 'Cooling', name: 'Standing / table fan', watts: 60, night: 8, aliases: ['standing fan', 'table fan', 'rechargeable fan', 'fan'] },
    { id: 'ac1', group: 'Cooling', name: 'Air conditioner (1 HP)', watts: 900, night: 6, aliases: ['ac', 'a/c', 'aircon', 'air con', 'air conditioning', 'split unit', '1hp'] },
    { id: 'ac15', group: 'Cooling', name: 'Air conditioner (1.5 HP)', watts: 1300, night: 6, aliases: ['ac', 'a/c', 'aircon', 'air con', 'air conditioning', 'split unit', '1.5hp'] },
    { id: 'ac2', group: 'Cooling', name: 'Air conditioner (2 HP)', watts: 1800, night: 6, aliases: ['ac', 'a/c', 'aircon', 'air con', 'air conditioning', 'split unit', '2hp'] },
    { id: 'fridge', group: 'Kitchen', name: 'Refrigerator', watts: 150, night: 12, aliases: ['fridge', 'fridge freezer', 'refridgerator'] },
    { id: 'freezer', group: 'Kitchen', name: 'Chest / deep freezer', watts: 200, night: 12, aliases: ['deep freezer', 'chest freezer', 'freezer', 'fridge'] },
    { id: 'microwave', group: 'Kitchen', name: 'Microwave', watts: 1200, night: 0, aliases: ['micro wave', 'oven'] },
    { id: 'kettle', group: 'Kitchen', name: 'Electric kettle', watts: 1500, night: 0, aliases: ['kettle', 'boiling ring', 'water heater'] },
    { id: 'blender', group: 'Kitchen', name: 'Blender', watts: 400, night: 0, aliases: ['grinder', 'mixer', 'juicer'] },
    { id: 'tv', group: 'Entertainment & work', name: 'LED TV', watts: 100, night: 4, aliases: ['television', 'telly', 'smart tv', 'tv'] },
    { id: 'decoder', group: 'Entertainment & work', name: 'Decoder (DStv / GOtv)', watts: 25, night: 4, aliases: ['dstv', 'gotv', 'startimes', 'cable', 'cable tv'] },
    { id: 'sound', group: 'Entertainment & work', name: 'Sound system', watts: 100, night: 2, aliases: ['home theatre', 'home theater', 'speaker', 'speakers', 'woofer', 'sub woofer'] },
    { id: 'router', group: 'Entertainment & work', name: 'Wi-Fi router', watts: 15, night: 12, aliases: ['wifi', 'wi-fi', 'internet', 'mifi', 'modem'] },
    { id: 'laptop', group: 'Entertainment & work', name: 'Laptop', watts: 65, night: 3, aliases: ['computer', 'pc', 'macbook', 'notebook'] },
    { id: 'desktop', group: 'Entertainment & work', name: 'Desktop computer', watts: 200, night: 3, aliases: ['computer', 'pc', 'monitor'] },
    { id: 'charger', group: 'Entertainment & work', name: 'Phone charger', watts: 10, night: 2, aliases: ['phone', 'charging'] },
    { id: 'iron', group: 'Household', name: 'Pressing iron', watts: 1000, night: 0, aliases: ['iron', 'pressing'] },
    { id: 'washer', group: 'Household', name: 'Washing machine', watts: 500, night: 0, aliases: ['washer', 'washing'] },
    { id: 'pump', group: 'Household', name: 'Water pump (1 HP)', watts: 750, night: 0, aliases: ['pumping machine', 'pump', 'borehole', 'water pump', 'pumping'] },
    { id: 'cctv', group: 'Household', name: 'CCTV / security system', watts: 40, night: 12, aliases: ['camera', 'security camera', 'cctv'] }
  ];
  var NIGHT_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  var KVA_SIZES = [3.5, 5, 7.5, 10, 15, 20, 25, 30];
  var GROUP_ICONS = { 'Lighting': 'i-bulb', 'Cooling': 'i-snow', 'Kitchen': 'i-fridge', 'Entertainment & work': 'i-tv', 'Household': 'i-house' };
  function nightOptions() {
    return NIGHT_OPTIONS.map(function (h) {
      return { value: String(h), icon: h ? 'i-moon' : 'i-sun', label: h === 0 ? 'Not needed at night' : h + (h === 1 ? ' hour' : ' hours'), short: h === 0 ? 'Day only' : '',
        meta: h === 0 ? 'Daytime only' : '' };
    });
  }
  function applianceOptions() {
    return APPLIANCES.map(function (x) {
      return { value: x.id, group: x.group, icon: GROUP_ICONS[x.group], label: x.name, meta: x.watts + ' W', terms: [x.name, x.group].concat(x.aliases || []) };
    });
  }

  /* Custom dropdown: a button that opens a styled list (a bottom sheet on phones).
     o: { key, id, value, options, placeholder, title, ariaLabel, search, small } */
  function dropdown(o) {
    var cur = o.options.filter(function (x) { return x.value === String(o.value); })[0];
    var face = function (x, onButton) {
      return '<span class="qm-dd__icon" aria-hidden="true">' + icon(x.icon) + '</span>' +
        '<span class="qm-dd__label">' + esc(onButton && x.short ? x.short : x.label) + '</span>' +
        (x.meta ? '<span class="qm-dd__meta' + (x.tone ? ' qm-dd__meta--' + x.tone : '') + '">' + esc(x.meta) + '</span>' : '');
    };
    var opt = function (x) {
      var on = cur && cur.value === x.value;
      return '<button type="button" role="option" class="qm-dd__opt' + (on ? ' is-selected' : '') + '" aria-selected="' + !!on + '" data-ddpick="' + o.key + '" data-value="' + esc(x.value) + '" data-text="' + esc((x.terms || [x.label]).join('|')) + '">' +
        face(x) + '<span class="qm-dd__tick" aria-hidden="true">' + icon('i-check') + '</span></button>';
    };
    var groups = [], byGroup = {};
    o.options.forEach(function (x) { var g = x.group || ''; if (!byGroup[g]) { byGroup[g] = []; groups.push(g); } byGroup[g].push(x); });
    var listId = 'dd-' + o.key;
    return '<div class="qm-dd' + (o.small ? ' qm-dd--sm' : '') + '" data-dd="' + o.key + '">' +
      '<button type="button" class="qm-dd__btn' + (cur ? '' : ' is-empty') + '"' + (o.id ? ' id="' + o.id + '"' : '') + ' aria-haspopup="listbox" aria-expanded="false" aria-controls="' + listId + '" data-ddopen="' + o.key + '"' + (o.ariaLabel ? ' aria-label="' + esc(o.ariaLabel) + '"' : '') + '>' +
        (cur ? face(cur, true) : '<span class="qm-dd__icon" aria-hidden="true">' + icon(o.search ? 'i-search' : 'i-moon') + '</span><span class="qm-dd__label">' + esc(o.placeholder) + '</span>') +
        '<span class="qm-dd__chev" aria-hidden="true">' + icon('i-chevron') + '</span></button>' +
      '<div class="qm-dd__panel" hidden>' +
        '<div class="qm-dd__head"><strong>' + esc(o.title) + '</strong><button type="button" class="qm-dd__close" data-ddclose aria-label="Close">' + icon('i-x') + '</button></div>' +
        (o.search ? '<div class="qm-dd__search">' + icon('i-search') + '<input type="search" data-ddsearch placeholder="Search, e.g. fan, fridge, AC" autocomplete="off" enterkeyhint="search" aria-label="Search appliances">' +
          '<button type="button" class="qm-dd__clear" data-ddclear aria-label="Clear search" hidden>' + icon('i-x') + '</button></div>' : '') +
        '<div class="qm-dd__list" id="' + listId + '" role="listbox" aria-label="' + esc(o.title) + '">' +
          groups.map(function (g) {
            return g ? '<div class="qm-dd__sec" role="group" aria-label="' + esc(g) + '"><p class="qm-dd__group" aria-hidden="true">' + icon(GROUP_ICONS[g] || 'i-bolt') + esc(g) + '</p>' + byGroup[g].map(opt).join('') + '</div>'
              : byGroup[g].map(opt).join('');
          }).join('') +
          (o.search ? '<p class="qm-dd__empty" hidden></p>' : '') +
        '</div></div></div>';
  }
  function appliance(id) { return APPLIANCES.filter(function (x) { return x.id === id; })[0]; }
  // nightQty is how many of a line run at night; ALL means every one, whatever the quantity.
  var ALL = 99;
  function nightCount(row) { return row.night ? Math.min(row.nightQty, row.qty) : 0; }
  function nightQtyValue(row) { return row.nightQty >= row.qty ? ALL : row.nightQty; }
  function nightTag(row) {
    var n = nightCount(row);
    if (!n) return '<span class="qm-list__tag qm-list__tag--day">' + icon('i-sun') + 'Day only</span>';
    var who = row.qty === 1 ? 'Runs' : (n >= row.qty ? 'All ' + row.qty : n + ' of ' + row.qty);
    return '<span class="qm-list__tag">' + icon('i-moon') + who + ' at night · ' + row.night + (row.night === 1 ? ' hour' : ' hours') + '</span>';
  }
  function nightQtyOptions(qty) {
    var out = [];
    for (var k = 1; k < qty; k++) out.push({ value: String(k), icon: 'i-moon', label: k + ' of ' + qty });
    out.push({ value: String(ALL), icon: 'i-moon', label: 'All ' + qty });
    return out;
  }

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
      nightWh += a.watts * nightCount(row) * row.night;
      items.push(row.qty + ' x ' + a.name + ' (' + a.watts + 'W, ' + (row.night
        ? (row.nightQty >= row.qty ? (row.qty > 1 ? 'all ' + row.qty : '1') : row.nightQty + ' of ' + row.qty) + ' at night for ' + row.night + 'h'
        : 'daytime only') + ')');
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
    appliances: ['i-house', 'Which appliances do you want to power?', 'Add each appliance and how many you have, then choose how many of them you need at night and for how long. You can change or remove anything on your list.'],
    kva: ['i-bolt', 'Choose your system size', 'Not sure? Your installer confirms the right size at your free home audit, a no-obligation visit to check your roof and what you want to power.'],
    tier: ['i-badge', 'What quality of system do you want?', 'Your installer explains each option in detail at your free home audit.'],
    budget: ['i-wallet', "What's your investment range?", 'This helps your installer prepare an accurate proposal.'],
    timeline: ['i-calendar', 'When would you like to go solar?', 'This helps us prioritise your request and match you with an available installer.'],
    consent: ['i-handshake', 'Ready to be matched?', 'Only your project details are shared. Your contact details go only to the installer you choose.'],
    contact: ['i-phone', "Almost there, you're one step away", 'We will send your Application ID to your WhatsApp to verify your request.'],
    otp: ['i-shield', 'Enter your Application ID', 'We sent it to your WhatsApp number. Enter it to confirm your request.']
  };

  /* The four stages shown in the journey panel. */
  /* Every branching answer (power source, system size) sits in an earlier
     section than the questions it adds or removes, so a section's
     question count never changes while the visitor is inside it. */
  var STAGES = [
    { name: 'Your home', steps: ['zone', 'state', 'property', 'ownership', 'shading', 'power'] },
    { name: 'Your energy', steps: ['spend', 'generator', 'appliances', 'kva'] },
    { name: 'Your system', steps: ['decision', 'tier', 'budget', 'timeline'] },
    { name: 'Your details', steps: ['consent', 'contact', 'otp'] }
  ];
  function stageOf(step) {
    for (var i = 0; i < STAGES.length; i++) if (STAGES[i].steps.indexOf(step) > -1) return i;
    return STAGES.length;
  }

  /* ---------- State ---------- */
  var form, current, busy, error, lastFocus;
  function reset() {
    form = {
      zone: '', state: '', propertyType: '', propertyTypes: [], otherProperty: '', ownership: '', roofShade: '',
      electricitySource: '', weeklySpend: '', generatorSize: '', decisionRole: '',
      kva: '', systemTier: '', budgetRange: '', budgetInput: '',
      timeline: '', consent: '', title: '', firstName: '', lastName: '', phone: '', otp: '',
      appliances: [], draft: { id: '', qty: 1, nightQty: ALL, night: 0 }
    };
    current = 'zone'; busy = false; error = '';
  }

  function budgetOptions() {
    return (BUDGET_BANDS[form.kva] || []).map(function (band) {
      var m = millions(band);
      var sub = m.length > 1 ? '20% down: ' + naira(m[0] * DOWN_SHARE) + ' to ' + naira(m[1] * DOWN_SHARE)
        : (m.length ? '20% down: from ' + naira(m[0] * DOWN_SHARE) : '');
      return { value: band, label: band, sub: sub };
    }).concat([ABOVE_PLAN, NOT_READY].map(function (v) { return { value: v, label: BUDGET_LABELS[v] }; }));
  }
  function kvaOut() { return form.kva === 'none' || form.kva === 'unsure'; }
  // "Above my budget" and "not ready" now lead to the instalment plan, not out of the funnel.
  function budgetOut() { return form.budgetRange === NOT_READY || form.budgetRange === ABOVE_PLAN; }
  function disqualified() { return kvaOut(); }
  function usesGenerator() { return /generator/i.test(form.electricitySource); }

  // The ordered list of steps for the answers given so far.
  function path() {
    var p = ['zone', 'state', 'property', 'ownership', 'shading', 'power', 'spend'];
    if (usesGenerator()) p.push('generator');
    p.push('appliances', 'kva', 'decision');
    if (!kvaOut()) p.push('tier', 'budget');
    p.push('timeline', 'consent', 'contact', 'otp');
    return p;
  }

  function canNext(step) {
    var f = form;
    switch (step) {
      case 'contact': return !!f.title && f.firstName.trim() && f.lastName.trim() && f.phone.replace(/\D/g, '').length >= 9;
      case 'otp': return f.otp.trim().length === 6;
      default: return true;
    }
  }

  // Slide the current question out, then the next one in (direction-aware).
  var dir = 'fwd', leaving = false;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function go(step, direction) {
    dir = direction || 'fwd';
    error = '';
    var old = body && body.firstChild;
    if (reduceMotion || !old || !old.classList) { current = step; render(true); return; }
    leaving = true;
    old.classList.add('is-leaving', 'is-leaving--' + dir);
    setTimeout(function () { leaving = false; current = step; render(true); }, 170);
  }
  function next() {
    var p = path(); var i = p.indexOf(current);
    if (i > -1 && i < p.length - 1) go(p[i + 1], 'fwd');
  }
  function back() {
    var p = path(); var i = p.indexOf(current);
    if (i > 0) go(p[i - 1], 'back');
  }

  /* Tracking ID, e.g. HB-7K2Q9M (no 0/O/1/I to avoid misreading). */
  function makeTrackingId() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', out = '';
    var rnd = new Uint32Array(6);
    (window.crypto || window.msCrypto).getRandomValues(rnd);
    for (var i = 0; i < 6; i++) out += chars[rnd[i] % chars.length];
    return 'HB-' + out;
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
    if (!form.trackingId) form.trackingId = makeTrackingId();
    post('submit.php', {
      title: f.title, firstName: f.firstName.trim(), lastName: f.lastName.trim(),
      phone: f.phone.trim(), otp: f.otp.trim(),
      zone: f.zone, state: f.state,
      propertyTypes: f.propertyTypes, otherProperty: f.otherProperty,
      ownership: f.ownership, roofShade: f.roofShade,
      electricitySource: f.electricitySource, weeklySpend: f.weeklySpend,
      generatorSize: f.generatorSize, decisionRole: f.decisionRole,
      kva: f.kva, systemTier: f.systemTier,
      budgetRange: f.budgetRange,
      instalmentInterest: budgetOut(),
      upfrontBudget: budgetOut() ? f.budgetInput.replace(/[^\d]/g, '') : '',
      timeline: f.timeline, consent: f.consent,
      disqualified: disqualified(),
      appliances: loadSummary.items,
      loadWatts: loadSummary.watts,
      nightKwh: loadSummary.nightKwh,
      projectedSpend: loadSummary.spend,
      recommendedKva: loadSummary.kva,
      recommendedBatteryKwh: loadSummary.batteryKwh,
      trackingId: form.trackingId,
      source: SOURCE
    }).then(function (data) {
      busy = false;
      if (data && data.success) {
        var held = disqualified() || form.consent === 'no';
        try {
          sessionStorage.setItem('hb-quote', JSON.stringify({
            name: form.firstName.trim(), state: form.state, held: held,
            kva: loadSummary.kva, batteryKwh: loadSummary.batteryKwh, spend: loadSummary.spend,
            appliances: form.appliances.length, timeline: form.timeline, trackingId: form.trackingId,
            // Masked so the full number is never kept in the browser.
            phone: (function (d) { return d.length >= 7 ? '0' + d.slice(-10, -7) + ' ••• ' + d.slice(-4) : ''; })(form.phone.replace(/\D/g, ''))
          }));
        } catch (e) {}
        try { localStorage.setItem('hb-last-tracking', form.trackingId); } catch (e) {}
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
        '<span class="qm-radio" aria-hidden="true"></span>' +
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
  function backBtn(label) { return '<button type="button" class="qm-back" data-action="back"><svg aria-hidden="true"><use href="#i-arrow"/></svg>' + esc(label || 'Back') + '</button>'; }
  function errorBox() { return error ? '<p class="qm-error" role="alert">' + esc(error) + '</p>' : ''; }

  function stepHtml(step) {
    var f = form;
    switch (step) {
      case 'zone':
        return '<div class="qm-zones">' + Object.keys(ZONES).map(function (z) {
          var on = f.zone === z;
          return '<button type="button" class="qm-zone' + (on ? ' is-selected' : '') + '" aria-pressed="' + on + '" data-set="zone" data-value="' + esc(z) + '">' +
            '<span class="qm-radio" aria-hidden="true"></span><span class="qm-zone__name">' + esc(z) + '</span><span class="qm-zone__states">' + esc(ZONES[z].join(' · ')) + '</span></button>';
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
        var kvaOpts = KVA_OPTIONS.map(function (o) {
          return o.price ? { label: o.label, value: o.value, price: o.price, sub: 'or ' + downOf(o.price) + ' down + monthly instalments' } : o;
        });
        return recNote + choice('kva', kvaOpts, { recommended: rec.kva }) + backBtn();
      case 'appliances':
        var sz = sizing(), d = f.draft;
        var tip = '<section class="qm-explain" aria-labelledby="qm-explain-title">' +
          '<p class="qm-explain__kicker" id="qm-explain-title">How your solar system works</p>' +
          '<ul class="qm-parts">' +
            '<li><span class="qm-parts__icon" aria-hidden="true">' + icon('i-panel') + '</span><div><strong>Solar panels</strong><span>Turn sunlight into power and <b>charge your battery</b> during the day.</span></div></li>' +
            '<li><span class="qm-parts__icon" aria-hidden="true">' + icon('i-battery') + '</span><div><strong>Battery</strong><span><b>Stores power</b> so you can keep using it after the sun goes down.</span></div></li>' +
            '<li><span class="qm-parts__icon" aria-hidden="true">' + icon('i-bolt') + '</span><div><strong>Inverter (kVA)</strong><span>Decides <b>how many things you can switch on at the same time</b>. It is the most your system can carry at once.</span></div></li>' +
          '</ul>' +
          '<div class="qm-chain" aria-label="More night use means a bigger battery, which needs more panels, which costs more">' +
            '<span>More use at night</span>' + icon('i-arrow') + '<span>Bigger battery</span>' + icon('i-arrow') + '<span>More panels to charge it</span>' + icon('i-arrow') + '<span class="qm-chain__end">Higher cost</span>' +
          '</div>' +
          '<div class="qm-explain__why">' +
            '<p class="qm-explain__q">"My friend has the same kVA. Why is mine more expensive?"</p>' +
            '<p>kVA only tells you the size of the inverter. Two homes can both have a 5 kVA system and pay very different prices, because the price mostly depends on <strong>what each home wants to power, especially at night</strong>. A home that runs an AC and a freezer all night needs a much bigger battery, and more panels to charge it, than a home that only keeps lights, fans and a TV on.</p>' +
          '</div>' +
          '<p class="qm-explain__tip">' + icon('i-check') + '<span><strong>Keep your cost down:</strong> only add what you truly need at night. You can still use more appliances during the day, while the sun is out.<span class="qm-explain__dayonly">If you won\'t use an appliance at night, choose ' + icon('i-sun') + '<strong>Day only</strong> for its hours. If you have several but only need some at night, say how many.</span></span></p>' +
          '</section>';
        var picker = '<div class="qm-picker">' +
          '<label class="qm-label" for="qm-appl">Appliance</label>' +
          dropdown({ key: 'appl', id: 'qm-appl', value: d.id, options: applianceOptions(), placeholder: 'Select an appliance', title: 'Choose an appliance', search: true }) +
          '<div class="qm-row">' +
            '<div><p class="qm-label" id="qm-qty-label">How many?</p><div class="qm-stepper qm-stepper--lg" role="group" aria-labelledby="qm-qty-label">' +
              '<button type="button" data-draftqty="-1" aria-label="One fewer"' + (d.qty > 1 ? '' : ' disabled') + '>−</button>' +
              '<span aria-live="polite">' + d.qty + '</span>' +
              '<button type="button" data-draftqty="1" aria-label="One more">+</button></div></div>' +
            '<div><label class="qm-label" for="qm-night">Hours to run at night</label>' +
              dropdown({ key: 'night', id: 'qm-night', value: d.night, options: nightOptions(), title: 'Hours to run at night' }) + '</div>' +
          '</div>' +
          (d.qty > 1 && d.night > 0
            ? '<div class="qm-nightqty"><label class="qm-label" for="qm-nq">How many of them will run at night?</label>' +
              dropdown({ key: 'nq', id: 'qm-nq', value: nightQtyValue(d), options: nightQtyOptions(d.qty), title: 'How many run at night?' }) +
              '<p class="qm-nightqty__hint">' + icon('i-moon') + '<span>Only count the ones you will switch on after dark. The rest still run in the day.</span></p></div>'
            : '') +
          '<button type="button" class="btn btn--dark qm-add" data-action="addAppliance"' + (d.id ? '' : ' disabled') + '>+ Add to my list</button>' +
          '</div>';
        var list = f.appliances.length
          ? '<p class="qm-group">Your appliances (' + f.appliances.length + ')</p><ul class="qm-list">' + f.appliances.map(function (row, i) {
              var x = appliance(row.id);
              return '<li class="qm-list__item">' +
                '<div class="qm-list__info"><strong>' + (row.qty > 1 ? row.qty + ' × ' : '') + esc(x.name) + '</strong><span>' + x.watts.toLocaleString() + ' W each</span>' + nightTag(row) + '</div>' +
                '<button type="button" class="qm-list__remove" data-remove="' + i + '" aria-label="Remove ' + esc(x.name) + '">' + icon('i-x') + '</button>' +
                '<div class="qm-list__edit">' +
                  '<div class="qm-stepper" role="group" aria-label="How many ' + esc(x.name) + '">' +
                    '<button type="button" data-rowqty="' + i + '" data-delta="-1" data-key="rm' + i + '" aria-label="One fewer"' + (row.qty > 1 ? '' : ' disabled') + '>−</button>' +
                    '<span aria-live="polite">' + row.qty + '</span>' +
                    '<button type="button" data-rowqty="' + i + '" data-delta="1" data-key="rp' + i + '" aria-label="One more">+</button>' +
                  '</div>' +
                  '<div class="qm-list__night"><span aria-hidden="true">At night</span>' +
                    (row.qty > 1 && row.night > 0 ? dropdown({ key: 'rq' + i, value: nightQtyValue(row), options: nightQtyOptions(row.qty), title: x.name + ': how many at night', ariaLabel: 'How many ' + x.name + ' run at night', small: true }) : '') +
                    dropdown({ key: 'row' + i, value: row.night, options: nightOptions(), title: x.name + ': hours at night', ariaLabel: 'Hours ' + x.name + ' should run at night', small: true }) + '</div>' +
                '</div></li>';
            }).join('') + '</ul>'
          : '<p class="qm-empty">No appliances added yet. Start with the ones you most want to keep running, like lights, fans and your fridge.</p>';
        var downStr = downOf(sz.spend);
        var summary = '<section class="qm-proj' + (sz.watts ? '' : ' is-empty') + '" aria-live="polite" aria-labelledby="qm-proj-title">' +
          '<header class="qm-proj__head"><p class="qm-proj__kicker" id="qm-proj-title">' + icon('i-sun') + 'Your projected system</p><span class="qm-proj__pill">Estimate</span></header>' +
          '<div class="qm-proj__specs">' +
            '<div class="qm-proj__spec"><span class="qm-proj__ico" aria-hidden="true">' + icon('i-bolt') + '</span><div>' +
              '<span class="qm-proj__label">Inverter</span><strong>' + (sz.kva ? esc(fmtKva(sz.kva)) : '–') + '</strong>' +
              '<small>' + (sz.watts ? sz.watts.toLocaleString() + ' W running at once' : 'Add appliances to see this') + '</small></div></div>' +
            '<div class="qm-proj__spec"><span class="qm-proj__ico" aria-hidden="true">' + icon('i-battery') + '</span><div>' +
              '<span class="qm-proj__label">Battery</span><strong>' + (sz.batteryKwh ? sz.batteryKwh + ' kWh' : (sz.watts ? 'Not needed' : '–')) + '</strong>' +
              '<small>' + (sz.batteryKwh ? 'For ' + sz.nightKwh + ' kWh used at night' : (sz.watts ? 'No night use added' : 'Set your night hours')) + '</small></div></div>' +
          '</div>' +
          '<div class="qm-proj__spend">' +
            '<div><span class="qm-proj__label">Projected spend</span><strong>' + (sz.spend ? esc(sz.spend) : '–') + '</strong></div>' +
            (downStr ? '<div class="qm-proj__down"><span>Start with 20% down</span><strong>' + (/^Above/.test(sz.spend) ? 'Above ' : 'About ') + downStr + '</strong><small>Rest in monthly instalments</small></div>' : '') +
          '</div>' +
          '<p class="qm-proj__note">' + icon('i-shield-alert') + '<span><strong>This is only a projection</strong> based on typical appliance ratings. Your installer confirms the exact size and price during the free home audit.</span></p>' +
          '</section>';
        return tip + picker + list + summary +
          primary('Continue', 'next', !f.appliances.length) + backBtn();
      case 'tier':
        return '<div class="qm-options">' + SYSTEM_TIERS.map(function (t) {
          var on = f.systemTier === t.value;
          return '<button type="button" class="qm-option qm-tier' + (on ? ' is-selected' : '') + '" aria-pressed="' + on + '" data-set="systemTier" data-value="' + t.value + '">' +
            '<span class="qm-radio" aria-hidden="true"></span><span class="qm-tier__top"><span class="qm-option__label">' + esc(t.label) + '</span><span class="qm-badge qm-badge--' + t.tone + '">' + esc(t.badge) + '</span></span>' +
            '<span class="qm-tier__warranty">' + esc(t.warranty) + '</span><span class="qm-option__sub">' + esc(t.desc) + '</span></button>';
        }).join('') + '</div>' + backBtn();
      case 'budget':
        var k = KVA_OPTIONS.filter(function (o) { return o.value === f.kva; })[0];
        var from = k ? k.price : '', fromM = millions(from)[0] || 0, down = downOf(from);
        var instal = !budgetOut() ? '' :
          '<section class="qm-instal" aria-labelledby="qm-instal-title">' +
            '<p class="qm-instal__title" id="qm-instal-title">' + icon('i-wallet') + 'How paying in instalments works</p>' +
            '<ol class="qm-instal__steps">' +
              '<li><span>1</span><div><strong>Pay 20% down</strong><small>About ' + esc(down) + ' for a ' + esc(k.label) + ' system</small></div></li>' +
              '<li><span>2</span><div><strong>Spread the rest monthly</strong><small>About ' + esc(naira(fromM * (1 - DOWN_SHARE))) + ', paid in monthly instalments</small></div></li>' +
              '<li><span>3</span><div><strong>Agree the plan with your installer</strong><small>They explain the monthly amount and length at your free home audit</small></div></li>' +
            '</ol>' +
            (f.budgetRange === ABOVE_PLAN
              ? '<label class="qm-label" for="qm-upfront">How much could you pay upfront? <span class="qm-optional">Optional</span></label>' +
                '<div class="qm-affix"><span>₦</span><input id="qm-upfront" class="qm-input" type="text" inputmode="numeric" placeholder="e.g. 500,000" data-field="budgetInput" value="' + esc(f.budgetInput) + '"></div>' +
                '<p class="qm-hint">This helps installers suggest a plan that fits.</p>'
              : '') +
            primary('Continue with instalments', 'next') +
          '</section>';
        return '<p class="qm-instal-line">' + icon('i-wallet') + '<span><strong>You don\'t pay this all at once.</strong> 20% down starts a ' + esc(k ? k.label : '') + ' system at about <strong>' + esc(down) + '</strong>, with the rest in monthly instalments.</span></p>' +
          choice('budgetRange', budgetOptions()) + instal + backBtn();
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
    document.documentElement.classList.remove('qm-dd-lock');
    var p = path();
    var done = current === 'done';
    var i = p.indexOf(current);
    var total = p.length;
    modal.classList.toggle('is-done', done);
    progressBar.style.width = (done ? 100 : Math.round((i / total) * 100)) + '%';

    // Journey: which stage we're in and how far through it.
    var stage = done ? STAGES.length : stageOf(current);
    var inStage = [], pos = 0;
    if (!done) {
      inStage = p.filter(function (st) { return STAGES[stage].steps.indexOf(st) > -1; });
      pos = inStage.indexOf(current);
    }
    Array.prototype.forEach.call(modal.querySelectorAll('.qa-stages li'), function (li, n) {
      li.classList.toggle('is-done', n < stage);
      li.classList.toggle('is-current', n === stage);
      if (n === stage) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    Array.prototype.forEach.call(modal.querySelectorAll('.qa-segments i'), function (bar, n) {
      bar.style.width = (n < stage ? 100 : n === stage ? Math.round((pos / Math.max(inStage.length, 1)) * 100) : 0) + '%';
    });

    progressText.textContent = done ? 'Complete' : STAGES[stage].name + ', question ' + (pos + 1) + ' of ' + inStage.length;

    var head = '';
    if (!done) {
      var m = META[current];
      head = '<div class="qm-head">' +
        '<p class="qm-eyebrow">' + esc(STAGES[stage].name) + '<span aria-hidden="true">·</span>Question ' + (pos + 1) + ' of ' + inStage.length + '</p>' +
        '<h2 class="qm-head__title" tabindex="-1">' + esc(m[1]) + '</h2><p class="qm-head__sub">' + esc(m[2]) + '</p></div>';
    }
    // Keep the caret where it is while typing.
    var active = document.activeElement;
    var activeField = active && active.getAttribute && active.getAttribute('data-field');
    var caret = activeField && active.selectionStart;

    body.innerHTML = '<div class="qm-step' + (stepChanged ? ' is-entering is-entering--' + dir : '') + '">' + head + stepHtml(current) + '</div>';

    // Gather Back and the main button into one action bar at the end of the step.
    var step = body.firstChild;
    var back = step.querySelector(':scope > .qm-back');
    var main = step.querySelector(':scope > .qm-primary');
    if (back || main) {
      var bar = document.createElement('div');
      bar.className = 'qm-actions' + (main ? '' : ' qm-actions--back-only');
      if (back) bar.appendChild(back);
      if (main) bar.appendChild(main);
      step.appendChild(bar);
    }

    if (stepChanged) {
      (pageMode ? window : body).scrollTo(0, 0);
      var t = body.querySelector('.qm-head__title, .qm-done__title');
      if (t) t.focus({ preventScroll: true });
    } else if (activeField) {
      var el = body.querySelector('[data-field="' + activeField + '"]');
      if (el) { el.focus(); try { el.setSelectionRange(caret, caret); } catch (e) {} }
    }
  }

  /* ---------- Events ---------- */
  function onClick(e) {
    if (leaving) return;
    var t = e.target.closest('button');
    if (!t || !body.contains(t)) return;
    if (t.hasAttribute('data-set')) {
      var field = t.getAttribute('data-set'), value = t.getAttribute('data-value');
      if (field === 'zone' && form.zone !== value) form.state = '';
      if (field === 'propertyType') form.propertyTypes = [value];   // the API expects a list
      if (field === 'kva' && form.kva !== value) { form.systemTier = ''; form.budgetRange = ''; form.budgetInput = ''; }
      if (field === 'electricitySource' && !/generator/i.test(value)) form.generatorSize = '';
      form[field] = value;
      if (field === 'budgetRange' && budgetOut()) {
        render();
        var panel = body.querySelector('.qm-instal');
        if (panel) panel.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
        return;
      }
      if (field === 'budgetRange') form.budgetInput = '';
      next();
      return;
    }
    if (t.hasAttribute('data-toggle')) {
      var v = t.getAttribute('data-toggle'), list = form.propertyTypes, at = list.indexOf(v);
      if (at > -1) list.splice(at, 1); else list.push(v);
      render();
      return;
    }
    if (t.hasAttribute('data-ddopen')) {
      var w = t.closest('.qm-dd');
      if (w.classList.contains('is-open')) closeDd(w, false); else openDd(w);
      return;
    }
    if (t.hasAttribute('data-ddclose')) { closeDd(t.closest('.qm-dd'), true); return; }
    if (t.hasAttribute('data-ddclear')) {
      var sInput = t.closest('.qm-dd').querySelector('[data-ddsearch]');
      sInput.value = '';
      filterDd(sInput);
      sInput.focus();
      return;
    }
    if (t.hasAttribute('data-ddpick')) { pickDd(t.getAttribute('data-ddpick'), t.getAttribute('data-value')); return; }
    if (t.hasAttribute('data-title')) { form.title = t.getAttribute('data-title'); render(); return; }
    if (t.hasAttribute('data-draftqty')) {
      form.draft.qty = Math.max(1, Math.min(50, form.draft.qty + +t.getAttribute('data-draftqty')));
      render();
      var same = body.querySelector('[data-draftqty="' + t.getAttribute('data-draftqty') + '"]');
      if (same && !same.disabled) same.focus({ preventScroll: true });
      return;
    }
    if (t.hasAttribute('data-rowqty')) {
      var r = form.appliances[+t.getAttribute('data-rowqty')];
      r.qty = Math.max(1, Math.min(50, r.qty + +t.getAttribute('data-delta')));
      var k = t.getAttribute('data-key');
      render();
      var b2 = body.querySelector('[data-key="' + k + '"]');
      if (b2 && !b2.disabled) b2.focus({ preventScroll: true });
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
      case 'addAppliance':
        var d = form.draft;
        if (!d.id) break;
        // Adding the same appliance again updates its line instead of duplicating it.
        var existing = form.appliances.filter(function (r) { return r.id === d.id && r.night === d.night; })[0];
        if (existing) {
          var bothAll = nightQtyValue(existing) === ALL && nightQtyValue(d) === ALL;
          var atNight = nightCount(existing) + nightCount(d);
          existing.qty = Math.min(50, existing.qty + d.qty);
          existing.nightQty = bothAll || !d.night ? ALL : atNight;
        } else {
          form.appliances.push({ id: d.id, qty: d.qty, nightQty: d.nightQty, night: d.night });
        }
        form.draft = { id: '', qty: 1, nightQty: ALL, night: 0 };
        render();
        var sel = body.querySelector('#qm-appl');
        if (sel) sel.focus({ preventScroll: true });
        break;
    }
  }
  /* ---------- Custom dropdowns ---------- */
  var phoneMq = window.matchMedia('(max-width: 599px)');
  function openDd(w) {
    body.querySelectorAll('.qm-dd.is-open').forEach(function (o) { closeDd(o, false); });
    var btn = w.querySelector('.qm-dd__btn'), panel = w.querySelector('.qm-dd__panel'), list = w.querySelector('.qm-dd__list');
    panel.hidden = false;
    w.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    if (phoneMq.matches) {
      document.documentElement.classList.add('qm-dd-lock');
    } else {
      // Bring the whole list into view if it opens below the fold.
      var r = panel.getBoundingClientRect(), gap = r.bottom + 16 - window.innerHeight;
      if (gap > 0) window.scrollBy({ top: Math.min(gap, btn.getBoundingClientRect().top - 80), behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    var sel = w.querySelector('.qm-dd__opt.is-selected');
    if (sel) list.scrollTop = sel.offsetTop - list.clientHeight / 2 + sel.offsetHeight / 2;
    var search = w.querySelector('[data-ddsearch]');
    var target = search && !phoneMq.matches ? search : (sel || w.querySelector('.qm-dd__opt'));
    if (target) target.focus({ preventScroll: true });
  }
  function closeDd(w, refocus) {
    if (!w || !w.classList.contains('is-open')) return;
    w.classList.remove('is-open');
    w.querySelector('.qm-dd__panel').hidden = true;
    var btn = w.querySelector('.qm-dd__btn');
    btn.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('qm-dd-lock');
    if (refocus) btn.focus({ preventScroll: true });
  }
  function pickDd(key, value) {
    if (key === 'appl') {
      form.draft.id = value;
      var x = appliance(value);
      if (x) form.draft.night = x.night;   // sensible default; they can change it
    } else if (key === 'night') {
      form.draft.night = +value;
    } else if (key === 'nq') {
      form.draft.nightQty = +value;
    } else if (key.indexOf('rq') === 0) {
      form.appliances[+key.slice(2)].nightQty = +value;
    } else {
      form.appliances[+key.slice(3)].night = +value;
    }
    document.documentElement.classList.remove('qm-dd-lock');
    render();
    var again = body.querySelector('[data-ddopen="' + key + '"]');
    if (again) again.focus({ preventScroll: true });
  }
  /* Search: ignores case, spaces and punctuation, accepts a trailing "s"
     ("fans", "ACs"), and matches the start of any word in a name or alias. */
  function words(str) { return str.toLowerCase().replace(/[^a-z0-9.]+/g, ' ').trim().split(' ').filter(Boolean); }
  function singular(w) { return w.length >= 3 && /[^s]s$/.test(w) ? w.slice(0, -1) : w; }
  function searchMatch(query, terms) {
    var q = words(query).map(singular);
    if (!q.length) return true;
    var compact = q.join('');
    return terms.some(function (t) {
      var tw = words(t);
      if (tw.join('').indexOf(compact) === 0) return true;
      return q.every(function (qw) { return tw.some(function (w) { return w.indexOf(qw) === 0; }); });
    });
  }
  function filterDd(input) {
    var w = input.closest('.qm-dd'), q = input.value, any = false;
    w.querySelectorAll('.qm-dd__opt').forEach(function (o) {
      var hit = searchMatch(q, o.getAttribute('data-text').split('|'));
      o.hidden = !hit;
      if (hit) any = true;
    });
    w.querySelectorAll('.qm-dd__sec').forEach(function (s) { s.hidden = !s.querySelector('.qm-dd__opt:not([hidden])'); });
    var clear = w.querySelector('[data-ddclear]');
    if (clear) clear.hidden = !q;
    var empty = w.querySelector('.qm-dd__empty');
    empty.hidden = any;
    if (!any) {
      empty.textContent = /^gen/.test(words(q).join(''))
        ? "No need to add your generator. Solar replaces it, so add the appliances it powers today, like your fridge, fans and TV."
        : 'No match for "' + q.trim() + '". Try another word, like fan, fridge or AC, or pick the closest appliance.';
    }
  }
  function onDdKey(e) {
    var w = e.target.closest && e.target.closest('.qm-dd');
    if (!w) return;
    var open = w.classList.contains('is-open');
    if (!open) {
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && e.target.matches('.qm-dd__btn')) { e.preventDefault(); openDd(w); }
      return;
    }
    var opts = Array.prototype.slice.call(w.querySelectorAll('.qm-dd__opt:not([hidden])'));
    var at = opts.indexOf(document.activeElement);
    switch (e.key) {
      case 'Escape': e.preventDefault(); e.stopPropagation(); closeDd(w, true); break;
      case 'Tab': e.preventDefault(); closeDd(w, true); break;
      case 'ArrowDown': e.preventDefault(); if (opts.length) opts[Math.min(at + 1, opts.length - 1)].focus(); break;
      case 'ArrowUp':
        e.preventDefault();
        if (at <= 0) { var s = w.querySelector('[data-ddsearch]'); if (s) s.focus(); else if (opts[0]) opts[0].focus(); }
        else opts[at - 1].focus();
        break;
      case 'Home': if (at > -1) { e.preventDefault(); opts[0].focus(); } break;
      case 'End': if (at > -1) { e.preventDefault(); opts[opts.length - 1].focus(); } break;
      case 'Enter':
        if (e.target.hasAttribute('data-ddsearch')) { e.preventDefault(); e.stopPropagation(); if (opts[0]) opts[0].click(); }
        break;
    }
  }
  function onDdOutside(e) {
    var w = body && body.querySelector('.qm-dd.is-open');
    if (w && !(w.contains(e.target) && e.target.closest('.qm-dd__panel, .qm-dd__btn'))) closeDd(w, false);
  }

  function onInput(e) {
    if (e.target.hasAttribute('data-ddsearch')) { filterDd(e.target); return; }
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
    body.addEventListener('keydown', onDdKey);
    document.addEventListener('click', onDdOutside, true);

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
