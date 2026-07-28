// ─────────────────────────────────────────────────────────────────
// No Marks Left — Fakedoor Analytics
//
// This loads posthog-js directly instead of using PostHog's minified
// bootstrap snippet. The snippet that shipped here before was a stale
// variant with two independent faults: it built a malformed asset
// hostname (us-assets.us), and its method list contained an entry
// ("posthog.toString") that threw before the queued init() was ever
// recorded — so the SDK downloaded but never initialised and not one
// event was sent. Doing it explicitly is a few more lines and far
// easier to debug.
//
// nml.track() buffers events until PostHog is ready, so nothing fired
// during page load is lost.
// ─────────────────────────────────────────────────────────────────

(function () {
  var PROJECT_KEY = 'phc_v5VvktDSvY4ew7ZmJYNwnmofsRUZgHxugYGcAQ6jF7vg';
  var API_HOST = 'https://us.i.posthog.com';
  var ASSET_HOST = 'https://us-assets.i.posthog.com';
  var MAX_QUEUE = 50;

  var queue = [];
  var ready = false;

  function send(call) {
    try {
      if (call.type === 'track') {
        posthog.capture(call.event, Object.assign({ experiment: 'fakedoor-v1' }, call.props || {}));
      } else if (call.type === 'identify') {
        posthog.identify(call.email, { email: call.email });
      }
    } catch (e) {
      if (window.console) console.warn('[nml] could not send', call.event || call.type, e);
    }
  }

  function enqueue(call) {
    if (ready) { send(call); return; }
    if (queue.length < MAX_QUEUE) queue.push(call);
  }

  window.nml = {
    track: function (event, props) {
      enqueue({ type: 'track', event: event, props: props });
    },
    identify: function (email) {
      if (email) enqueue({ type: 'identify', email: email });
    }
  };

  var script = document.createElement('script');
  script.src = ASSET_HOST + '/static/array.js';
  script.async = true;
  script.crossOrigin = 'anonymous';

  script.onload = function () {
    try {
      posthog.init(PROJECT_KEY, {
        api_host: API_HOST,
        capture_pageview: false,
        capture_pageleave: true,
        /* Mask every input in session replays. Our privacy policy promises
           that nothing typed into a field — card details included — is
           visible in a recording, so this must stay true. */
        session_recording: { maskAllInputs: true }
      });
      ready = true;
      for (var i = 0; i < queue.length; i++) send(queue[i]);
      queue.length = 0;
    } catch (e) {
      if (window.console) console.error('[nml] posthog.init failed', e);
    }
  };

  script.onerror = function () {
    if (window.console) console.warn('[nml] posthog blocked or unreachable — events dropped');
  };

  document.head.appendChild(script);
})();
