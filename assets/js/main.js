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

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
