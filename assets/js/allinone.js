/* All-in-one units: fit checks, generated capability lines and price lines.
   Used by the quiz (quote.js) and the catalogue page (units.html).

   There is no second sizing engine here. Every load figure comes from the
   quiz's own calculation, window.HB_LOAD.sizing(rows), run on the visitor's
   list (or a standard basket) with the same appliance wattage table. */
(function () {
  'use strict';

  var HEADROOM = 0.8;   // a unit may be loaded to 80% of its rating, never its ceiling
  /* Start-up surge. We have no per-appliance surge data yet, so we assume the
     largest motor load in the list (fridge, freezer, AC, pump, washing machine)
     briefly draws 3x its running watts while everything else keeps running. */
  var SURGE_MULTIPLIER = 3;
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function lib() { return window.HB_LOAD; }
  function config() { return window.HB_UNITS_CONFIG || { fulfilment: 'installer', maxShortlist: 3 }; }

  function units() {
    return (window.HB_UNITS || []).filter(function (u) { return u && u.status === 'active'; });
  }
  function byId(id) { return (window.HB_UNITS || []).filter(function (u) { return u.id === id; })[0] || null; }

  // What a list of appliances asks of a unit.
  function need(rows) {
    var s = lib().sizing(rows);
    return {
      kva: s.loadKva,
      nightKwh: s.nightNeedKwh,
      surgeW: s.watts + (SURGE_MULTIPLIER - 1) * s.motorW,
      sizing: s
    };
  }
  // Unconfirmed surge figures fall back to the rated output: no assumed headroom.
  function unitSurge(u) { return u.surge_w || u.kva * 1000; }

  // Which of the three rules a unit fails for this need: 'power', 'night', 'surge'.
  function fails(u, n) {
    var out = [];
    if (n.kva > u.kva * HEADROOM) out.push('power');
    if (n.nightKwh > u.usable_kwh) out.push('night');
    if (n.surgeW > unitSurge(u)) out.push('surge');
    return out;
  }
  function fits(u, rows) { return !fails(u, need(rows)).length; }
  function eligible(rows) {
    var n = need(rows);
    return units().filter(function (u) { return !fails(u, n).length; }).sort(bySize);
  }
  function bySize(a, b) { return a.kva - b.kva || a.usable_kwh - b.usable_kwh; }

  /* Which of the visitor's own appliances a unit cannot carry. Drops whole
     lines, biggest offender first, until what is left fits. */
  function coverage(u, rows) {
    var kept = rows.slice(), dropped = [];
    var reasons = fails(u, need(rows));
    while (kept.length) {
      var f = fails(u, need(kept));
      if (!f.length) break;
      var worst = 0, worstScore = -1;
      kept.forEach(function (row, i) {
        var a = lib().appliance(row.id);
        var score = f.indexOf('night') > -1 ? a.watts * lib().nightCount(row) * row.night
          : f.indexOf('power') > -1 ? a.watts * row.qty
          : (a.motor ? a.watts : 0);
        if (score > worstScore) { worstScore = score; worst = i; }
      });
      dropped.push(kept.splice(worst, 1)[0]);
    }
    if (!kept.length) dropped = rows.slice();
    return { fits: !reasons.length, reasons: reasons, kept: kept, dropped: dropped };
  }

  // Night-critical subset: lights, fans, fridge, TV, Wi-Fi and the like.
  function essentials(rows) {
    return rows.filter(function (r) { return lib().appliance(r.id).essential; });
  }
  // The smallest unit that carries the essentials, with what it leaves out.
  function essentialsOption(rows) {
    var ess = essentials(rows);
    if (!ess.length || ess.length === rows.length) return null;
    var u = eligible(ess)[0];
    if (!u) return null;
    var left = rows.filter(function (r) { return ess.indexOf(r) === -1; });
    return { unit: u, covered: ess, uncovered: left };
  }

  /* ---------- Words ---------- */
  function say(id, qty) {
    var parts = lib().appliance(id).say.split('|');
    return qty > 1 ? parts[1] : parts[0];
  }
  function joinAnd(list) {
    if (list.length < 2) return list.join('');
    return list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1];
  }
  function unique(list) { return list.filter(function (x, i) { return list.indexOf(x) === i; }); }
  // "your bulbs, ceiling fans, fridge and TV": the visitor's own appliances in their words.
  function names(rows) {
    return joinAnd(unique(rows.map(function (r) { return say(r.id, r.qty); })));
  }
  function counted(id, qty) {
    var word = say(id, qty);
    if (qty > 1) return qty + ' ' + word;
    return (/^[aeiou]/i.test(word) ? 'an ' : 'a ') + word;
  }

  /* Standard baskets, smallest to largest. Each appliance runs for its usual
     night hours from the quiz's table. A unit's capability line describes the
     largest basket it carries, so it can never disagree with the fit check. */
  var BASKETS = [
    [['bulb', 4], ['router', 1], ['charger', 2]],
    [['bulb', 4], ['standfan', 1], ['router', 1], ['charger', 2]],
    [['bulb', 6], ['ceilingfan', 2], ['tv', 1], ['router', 1]],
    [['bulb', 6], ['ceilingfan', 2], ['tv', 1], ['decoder', 1], ['router', 1], ['fridge', 1]],
    [['bulb', 8], ['ceilingfan', 3], ['tv', 1], ['decoder', 1], ['router', 1], ['fridge', 1], ['freezer', 1]],
    [['bulb', 8], ['ceilingfan', 3], ['tv', 1], ['decoder', 1], ['router', 1], ['fridge', 1], ['freezer', 1], ['ac1', 1]]
  ];
  function basketRows(b) {
    return b.map(function (x) { var a = lib().appliance(x[0]); return { id: x[0], qty: x[1], nightQty: 99, night: a.night }; });
  }
  // Index of the largest standard basket a unit carries (-1 if none).
  function level(u) {
    var best = -1;
    BASKETS.forEach(function (b, i) { if (fits(u, basketRows(b))) best = i; });
    return best;
  }
  // Filter labels for units.html, generated from the same baskets: "Bulbs, Wi-Fi router…", then "+ a fridge".
  function basketLabel(i) {
    var rows = basketRows(BASKETS[i]);
    if (!i) return names(rows).replace(/^./, function (c) { return c.toUpperCase(); });
    var prev = BASKETS[i - 1].map(function (x) { return x[0]; });
    var added = rows.filter(function (r) { return prev.indexOf(r.id) < 0; });
    return '+ ' + (added.length ? names(added) : 'more of the same');
  }
  function blurb(u) {
    var i = level(u);
    if (i < 0) return '';
    return 'Covers ' + joinAnd(BASKETS[i].map(function (x) { return counted(x[0], x[1]); })) + ' through the night.';
  }

  /* ---------- Prices ---------- */
  function naira(n) { return '₦' + Math.round(n).toLocaleString('en-US'); }
  function checked(u) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(u.price_checked || '');
    return m ? ' · checked ' + (+m[3]) + ' ' + MONTHS[+m[2] - 1] : '';
  }
  // Never a single number: a band, or "From" when only one bound is known.
  function priceLine(u) {
    var lo = u.price_low, hi = u.price_high;
    if (!lo && !hi) return '';
    var band = lo && hi && lo !== hi ? naira(lo) + ' – ' + naira(hi) : 'From ' + naira(lo || hi);
    return band + checked(u);
  }
  function downLine(u, share) {
    var lo = u.price_low || u.price_high;
    return lo ? 'or from ' + naira(lo * share) + ' down + monthly instalments' : '';
  }
  function specLine(u) { return u.kva + ' kVA · ' + u.usable_kwh + ' kWh'; }
  function title(u) { return u.brand + ' ' + u.model.replace(/\s*\(.*\)$/, ''); }

  // Plain reason a unit does not fit, for the request and for visitors.
  // Visitors see the main reason; pass all=true for every reason (sent to installers).
  function reasonText(u, rows, all) {
    var n = need(rows), f = fails(u, n), out = [];
    if (f.indexOf('night') > -1) out.push('it stores ' + u.usable_kwh + ' kWh, and your list needs about ' + (Math.round(n.nightKwh * 10) / 10) + ' kWh through the night');
    if (f.indexOf('power') > -1) out.push('it can safely run about ' + Math.round(u.kva * HEADROOM * 800).toLocaleString('en-US') + ' W at once, and your list adds up to about ' + Math.round(n.kva * 800).toLocaleString('en-US') + ' W');
    if (f.indexOf('surge') > -1) out.push('it cannot handle the start-up kick of your ' + say(biggestMotor(rows), 1));
    return all ? out.join('; ') : (out[0] || '');
  }
  function biggestMotor(rows) {
    var id = '', w = -1;
    rows.forEach(function (r) { var a = lib().appliance(r.id); if (a.motor && a.watts > w) { w = a.watts; id = r.id; } });
    return id;
  }

  window.HBAllInOne = {
    active: function () { return !!(lib() && units().length); },
    units: units, byId: byId, eligible: eligible, fits: fits, coverage: coverage,
    essentialsOption: essentialsOption, level: level, blurb: blurb, baskets: BASKETS, basketLabel: basketLabel,
    names: names, priceLine: priceLine, downLine: downLine, specLine: specLine, title: title,
    reasonText: reasonText, config: config, naira: naira
  };
})();
