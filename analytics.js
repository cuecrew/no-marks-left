// ─────────────────────────────────────────────────────────────────
// No Marks Left — Fakedoor Analytics
// ─────────────────────────────────────────────────────────────────
// Setup:
//   1. Sign up free at posthog.com
//   2. Settings → Project API Key → copy the key starting with phc_
//   3. Replace 'POSTHOG_KEY' below with your actual key
// ─────────────────────────────────────────────────────────────────

/* nml wrapper — defined first so it's always available regardless of PostHog status */
window.nml = {
  track: function(event, props) {
    try {
      if (!window.posthog || !window.posthog.capture) return;
      posthog.capture(event, Object.assign({ experiment: 'fakedoor-v1' }, props || {}));
    } catch(e) {}
  },
  identify: function(email) {
    try {
      if (!window.posthog || !window.posthog.identify || !email) return;
      posthog.identify(email, { email: email });
    } catch(e) {}
  }
};

/* PostHog loader — queues all events until the library downloads */
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]);t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","").replace("https://","https://us-assets.")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.people.toString(1)+" (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onFeatureFlags posthog.toString identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

try {
  posthog.init('POSTHOG_KEY', {
    api_host: 'https://us.i.posthog.com',
    capture_pageview: false,
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: { password: true, creditCard: true }
    }
  });
} catch(e) {}
