// ─────────────────────────────────────────────────────────────────
// No Marks Left — Fakedoor Analytics
//
// Design notes, because a fakedoor only runs once:
//
//  * ONE canonical add_to_cart event. Where it came from is a property
//    (source), never a different event name — otherwise the funnel has
//    to OR three events together and every rate is wrong.
//  * $pageview is fired manually under its real name so PostHog's Web
//    Analytics (paths, bounce, session duration) keeps working while
//    still carrying our own properties.
//  * person_profiles:'always' so anonymous visitors get profiles and
//    $initial_utm_* / $initial_referrer attribution. Almost nobody will
//    submit an email, and without this we cannot attribute channels.
//  * pricing_version is stamped on every event. Prices changed mid-build;
//    without it, old and new events pool into one meaningless number.
// ─────────────────────────────────────────────────────────────────

(function () {
  var PROJECT_KEY = 'phc_v5VvktDSvY4ew7ZmJYNwnmofsRUZgHxugYGcAQ6jF7vg';
  var API_HOST = 'https://us.i.posthog.com';
  var ASSET_HOST = 'https://us-assets.i.posthog.com';
  var MAX_QUEUE = 100;

  // Bump when prices or the catalogue change, so cohorts stay comparable.
  var PRICING_VERSION = 'v2-349-799';
  var EXPERIMENT = 'fakedoor-v1';

  // Monotonic funnel ladder. Persisted so it survives navigation, and only
  // ever ratchets upward — gives clean person-level cohorts in PostHog.
  var STAGES = {
    landed: 1,
    viewed_product: 2,
    added_to_cart: 3,
    checkout_started: 4,
    payment_attempted: 5,
    waitlisted: 6
  };

  var queue = [];
  var ready = false;

  function run(fn) {
    try { fn(); } catch (e) {
      if (window.console) console.warn('[nml]', e);
    }
  }

  function send(call) {
    run(function () {
      if (call.type === 'capture') {
        posthog.capture(call.event, call.props);
      } else if (call.type === 'identify') {
        posthog.identify(call.email, { email: call.email });
      } else if (call.type === 'set') {
        posthog.setPersonProperties(call.props);
      } else if (call.type === 'setOnce') {
        posthog.setPersonProperties(undefined, call.props);
      } else if (call.type === 'register') {
        posthog.register(call.props);
      }
    });
  }

  function enqueue(call) {
    if (ready) { send(call); return; }
    if (queue.length < MAX_QUEUE) queue.push(call);
  }

  // ── funnel stage ──────────────────────────────────────────────────
  function currentStage() {
    try { return parseInt(localStorage.getItem('nml_stage') || '0', 10) || 0; }
    catch (e) { return 0; }
  }

  function recordStage(name) {
    var rank = STAGES[name];
    if (!rank || rank <= currentStage()) return;
    try { localStorage.setItem('nml_stage', String(rank)); } catch (e) { }
    enqueue({
      type: 'set',
      props: {
        max_funnel_stage: name,
        max_funnel_stage_rank: rank,
        has_attempted_payment: rank >= STAGES.payment_attempted,
        is_waitlisted: rank >= STAGES.waitlisted
      }
    });
  }

  window.nml = {
    STAGES: STAGES,

    /* Named event. Super properties are attached by posthog.register(). */
    track: function (event, props, stage) {
      enqueue({ type: 'capture', event: event, props: props || {} });
      if (stage) recordStage(stage);
    },

    /* Fires the real $pageview so Web Analytics works, plus page-scoped
       super properties that then ride along on every later event. */
    page: function (name, props) {
      var base = Object.assign({ page: name }, props || {});
      enqueue({ type: 'register', props: base });
      enqueue({ type: 'capture', event: '$pageview', props: base });
      recordStage('landed');
      this.trackScroll(name);
    },

    identify: function (email) {
      if (!email) return;
      enqueue({ type: 'identify', email: email });
    },

    setPerson: function (props) { enqueue({ type: 'set', props: props }); },
    setPersonOnce: function (props) { enqueue({ type: 'setOnce', props: props }); },
    stage: recordStage,

    /* Fires once when an element is at least half visible. Gives every
       CTA and section an impression denominator, so a low click rate can
       be told apart from nobody ever scrolling to it. */
    trackImpression: function (el, event, props) {
      if (!el) return;
      if (!('IntersectionObserver' in window)) {
        this.track(event, Object.assign({ observer_unsupported: true }, props || {}));
        return;
      }
      var self = this;
      var seen = false;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (seen || !entry.isIntersecting) return;
          seen = true;
          io.disconnect();
          self.track(event, props);
        });
      }, { threshold: 0.5 });
      io.observe(el);
    },

    /* Scroll milestones. Height is measured at scroll time, not at load —
       images and JS-rendered grids change it after first paint, and the
       previous version cached a stale height so the percentages lied. */
    trackScroll: function (pageName) {
      var hit = {};
      var self = this;
      function check() {
        var doc = document.documentElement;
        var height = Math.max(doc.scrollHeight, document.body.scrollHeight) - window.innerHeight;
        if (height <= 0) return;
        var pct = Math.round(((window.scrollY || doc.scrollTop) / height) * 100);
        [25, 50, 75, 100].forEach(function (mark) {
          if (pct >= mark && !hit[mark]) {
            hit[mark] = true;
            self.track('scroll_depth', { depth: mark, page: pageName });
          }
        });
      }
      window.addEventListener('scroll', check, { passive: true });
      check();
    },

    /* Delegated nav/footer/outbound clicks. Autocapture already records
       every click; these are the few we want as named events so they can
       be used directly in funnels without digging through autocapture. */
    trackChrome: function () {
      var self = this;
      document.addEventListener('click', function (e) {
        var link = e.target.closest('a');
        if (!link) return;
        var href = link.getAttribute('href') || '';
        if (link.closest('.f-links')) {
          self.track('footer_link_click', { link_text: link.textContent.trim(), href: href });
        } else if (link.closest('nav')) {
          self.track('nav_click', { link_text: link.textContent.trim(), href: href });
        } else if (href.indexOf('mailto:') === 0) {
          self.track('outbound_click', { kind: 'email', href: href });
        } else if (/^https?:/.test(href) && href.indexOf(location.host) === -1) {
          self.track('outbound_click', { kind: 'external', href: href });
        }
      }, true);
    }
  };

  var script = document.createElement('script');
  script.src = ASSET_HOST + '/static/array.js';
  script.async = true;
  script.crossOrigin = 'anonymous';

  script.onload = function () {
    run(function () {
      posthog.init(PROJECT_KEY, {
        api_host: API_HOST,
        // Fired manually in nml.page() so it can carry page properties.
        capture_pageview: false,
        capture_pageleave: true,
        // Every visitor gets a profile, so initial UTM and referrer are
        // recorded even though almost none of them will ever identify.
        person_profiles: 'always',
        // Exhaustive click coverage without hand-instrumenting each button.
        autocapture: true,
        rageclick: true,
        /* Session replay is OFF. It is the most invasive thing PostHog can do
           and there is no consent banner here yet, so recording visitors —
           including EU/UK traffic arriving from Reddit — is not defensible.
           The funnel events already answer the question replay would. */
        disable_session_recording: true
      });

      posthog.register({
        experiment: EXPERIMENT,
        pricing_version: PRICING_VERSION
      });

      ready = true;
      for (var i = 0; i < queue.length; i++) send(queue[i]);
      queue.length = 0;
    });
  };

  script.onerror = function () {
    if (window.console) console.warn('[nml] posthog blocked or unreachable — events dropped');
  };

  document.head.appendChild(script);
})();
