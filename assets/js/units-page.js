/* units.html: browsable all-in-one catalogue.
   Leads with what each unit runs and its price; brand is a secondary filter.
   ?brand=itel lands pre-filtered. Every card has one action, which opens the
   normal quiz with the unit tagged (?unit=id). The quiz asks the same questions. */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function icon(id) { return '<svg aria-hidden="true"><use href="#' + id + '"/></svg>'; }

  function init() {
    var A = window.HBAllInOne, grid = document.getElementById('un-grid');
    if (!grid) return;
    var empty = document.getElementById('un-empty'), count = document.getElementById('un-count');

    if (!A || !A.active()) {
      count.textContent = '';
      empty.hidden = false;
      empty.innerHTML = '<p><strong>All-in-one units are not available right now.</strong> Tell us what you want to power and we\'ll match you with the right system.</p>' +
        '<a class="btn btn--accent" href="get-quotes.html">Check what fits my home<span class="btn__icon" aria-hidden="true">' + icon('i-arrow') + '</span></a>';
      return;
    }

    var units = A.units().slice().sort(function (a, b) { return a.kva - b.kva || a.usable_kwh - b.usable_kwh; });
    var levels = {};
    units.forEach(function (u) { levels[u.id] = A.level(u); });
    var brands = units.map(function (u) { return u.brand; }).filter(function (b, i, l) { return l.indexOf(b) === i; });

    var params = new URLSearchParams(location.search);
    var brandParam = (params.get('brand') || '').toLowerCase();
    var state = {
      need: -1,
      brand: brands.filter(function (b) { return b.toLowerCase() === brandParam; })[0] || ''
    };

    // Need filter: only offer basket levels at least one unit reaches.
    var maxLevel = Math.max.apply(null, units.map(function (u) { return levels[u.id]; }));
    var needEl = document.getElementById('un-need'), brandEl = document.getElementById('un-brand');
    var needChips = ['<button type="button" class="un-chip" data-need="-1">Show all</button>'];
    for (var i = 0; i <= maxLevel; i++) needChips.push('<button type="button" class="un-chip" data-need="' + i + '">' + esc(A.basketLabel(i)) + '</button>');
    needEl.innerHTML = needChips.join('');
    brandEl.innerHTML = ['<button type="button" class="un-chip" data-brand="">All brands</button>'].concat(brands.map(function (b) {
      return '<button type="button" class="un-chip" data-brand="' + esc(b) + '">' + esc(b) + '</button>';
    })).join('');
    document.getElementById('un-filters').hidden = false;

    function card(u) {
      var blurb = A.blurb(u), price = A.priceLine(u), down = A.downLine(u, 0.2);
      return '<li class="un-card">' +
        '<div class="un-card__media" aria-hidden="true">' + (u.photo ? '<img src="' + esc(u.photo) + '" alt="" loading="lazy">' : icon('i-battery')) + '</div>' +
        '<div class="un-card__body">' +
          '<p class="un-card__brand">' + esc(u.brand) + '</p>' +
          '<h2 class="un-card__title">' + esc(A.title(u)) + '</h2>' +
          (blurb ? '<p class="un-card__runs">' + esc(blurb) + '</p>' : '') +
          '<p class="un-card__price">' + (price ? '<strong>' + esc(price) + '</strong>' + (down ? '<span>' + esc(down) + '</span>' : '') : '<strong>Price on request</strong><span>Installers quote the current price</span>') + '</p>' +
          '<ul class="un-card__specs">' +
            '<li>' + icon('i-bolt') + esc(u.kva) + ' kVA output</li>' +
            '<li>' + icon('i-battery') + esc(u.usable_kwh) + ' kWh stored</li>' +
            (u.panels_included ? '<li>' + icon('i-sun') + 'Panels included' + (u.panel_detail ? ' (' + esc(u.panel_detail) + ')' : '') + '</li>' : '') +
            (u.warranty_months ? '<li>' + icon('i-check') + esc(u.warranty_months) + '-month warranty</li>' : '') +
          '</ul>' +
          '<a class="btn btn--accent un-card__cta" href="get-quotes.html?unit=' + encodeURIComponent(u.id) + '">Check if this fits my home<span class="btn__icon" aria-hidden="true">' + icon('i-arrow') + '</span></a>' +
        '</div></li>';
    }

    function render() {
      var list = units.filter(function (u) {
        return (!state.brand || u.brand === state.brand) && levels[u.id] >= state.need;
      });
      grid.innerHTML = list.map(card).join('');
      count.textContent = list.length + (list.length === 1 ? ' unit' : ' units') + (state.brand ? ' from ' + state.brand : '');
      empty.hidden = !!list.length;
      if (!list.length) {
        empty.innerHTML = '<p><strong>No unit ' + (state.brand ? 'from ' + esc(state.brand) + ' ' : '') + 'runs all of that through the night.</strong> A custom system might. Tell us what you want to power and we\'ll show you what fits.</p>' +
          '<a class="btn btn--accent" href="get-quotes.html' + (state.brand ? '?brand=' + encodeURIComponent(state.brand.toLowerCase()) : '') + '">Check what fits my home<span class="btn__icon" aria-hidden="true">' + icon('i-arrow') + '</span></a>';
      }
      Array.prototype.forEach.call(needEl.children, function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-need') === state.need)); });
      Array.prototype.forEach.call(brandEl.children, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-brand') === state.brand)); });
    }

    needEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-need]');
      if (!b) return;
      state.need = +b.getAttribute('data-need');
      render();
    });
    brandEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-brand]');
      if (!b) return;
      state.brand = b.getAttribute('data-brand');
      // Keep the link shareable, so ad and search intent survives a copy-paste.
      var url = new URL(location.href);
      if (state.brand) url.searchParams.set('brand', state.brand.toLowerCase()); else url.searchParams.delete('brand');
      try { history.replaceState(null, '', url); } catch (err) {}
      render();
    });
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
