/* Heliobond — progressive enhancements. The page is fully usable without this file. */
(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  /* ---------- Mobile navigation ---------- */
  function setOpen(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('nav-open', open);
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (!header.contains(e.target)) setOpen(false);
    });

    // Reset when resizing back to the desktop layout.
    var desktop = window.matchMedia('(min-width: 961px)');
    var onChange = function (mq) { if (mq.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else if (desktop.addListener) desktop.addListener(onChange);
  }

  /* ---------- Header border once scrolled ---------- */
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Image fallback: keep the styled placeholder if a photo fails ---------- */
  document.querySelectorAll('.media > img').forEach(function (img) {
    var mark = function () { img.parentElement.classList.add('is-broken'); };
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) mark();
    else img.addEventListener('error', mark, { once: true });
  });

  /* ---------- Video testimonials ----------
     Each .video-card takes a data-video attribute: an .mp4 path or a YouTube link.
     Cards without one keep their "Video coming soon" label and a disabled play button. */
  function youTubeId(url) {
    var m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  document.querySelectorAll('.video-card').forEach(function (card) {
    var src = (card.getAttribute('data-video') || '').trim();
    var button = card.querySelector('.video-card__play');
    var media = card.querySelector('.video-card__media');
    if (!button || !media) return;

    if (!src) {
      button.disabled = true;
      return;
    }
    card.classList.add('has-video');

    button.addEventListener('click', function () {
      var id = youTubeId(src);
      var player;
      if (id) {
        player = document.createElement('iframe');
        player.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
        player.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        player.allowFullscreen = true;
        player.title = button.textContent.trim();
      } else {
        player = document.createElement('video');
        player.src = src;
        player.controls = true;
        player.autoplay = true;
        player.playsInline = true;
      }
      media.appendChild(player);
      button.remove();
      card.classList.add('is-playing');
      if (player.focus) player.focus();
    });
  });

  /* ---------- Press and partner logos ---------- */
  // Show the text name when a logo file hasn't been added yet.
  document.querySelectorAll('.logo-strip__img').forEach(function (img) {
    var fallback = function () { img.closest('.logo-strip__item').classList.add('no-logo'); };
    if (img.complete && img.naturalWidth === 0) fallback();
    else img.addEventListener('error', fallback);
    img.loading = 'eager';
  });

  // Turn each strip into a continuous slider unless the visitor prefers reduced motion.
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    document.querySelectorAll('.logo-strip').forEach(function (strip) {
      var list = strip.querySelector('.logo-strip__list');
      if (!list) return;
      var track = document.createElement('div');
      track.className = 'logo-strip__track';
      list.parentNode.insertBefore(track, list);
      track.appendChild(list);

      // Repeat the logos so a short list still fills wide screens, then duplicate the
      // whole set once so the -50% animation loops seamlessly.
      var originals = Array.prototype.slice.call(list.children);
      for (var i = 0; i < 2; i++) {
        originals.forEach(function (li) {
          var copy = li.cloneNode(true);
          copy.setAttribute('aria-hidden', 'true');
          var copyImg = copy.querySelector('img');
          if (copyImg) {
            copyImg.alt = '';
            copyImg.addEventListener('error', function () { copy.classList.add('no-logo'); });
          }
          list.appendChild(copy);
        });
      }
      var clone = list.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('li').forEach(function (li) {
        li.setAttribute('aria-hidden', 'true');
        var im = li.querySelector('img');
        if (im) {
          im.alt = '';
          im.addEventListener('error', function () { li.classList.add('no-logo'); });
          if (im.complete && im.naturalWidth === 0) li.classList.add('no-logo');
        }
      });
      track.appendChild(clone);

      strip.style.setProperty('--slide-duration', (originals.length * 6) + 's');
      strip.classList.add('is-sliding');
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
