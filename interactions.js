// ─── No Marks Left — Frontend Interactions ───────────────────────────────────
// Effect 1: Background colour wash on product hover
// Effect 2: Chocolate snap sound + shatter particles + badge bounce on add-to-cart

document.addEventListener('DOMContentLoaded', function() {

// ── Wash overlay ──────────────────────────────────────────────────────────────
var wash = document.createElement('div');
wash.id = 'nml-wash';
wash.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;transition:background 0.75s ease;background:transparent;';
document.body.appendChild(wash);

var WASH = {
  pi1: 'rgba(139,26,26,0.18)',
  pi2: 'rgba(110,32,112,0.18)',
  pi3: 'rgba(24,24,60,0.2)',
  pi4: 'rgba(130,70,8,0.18)',
  pi5: 'rgba(28,84,30,0.18)',
  pi6: 'rgba(50,50,70,0.18)'
};

function getPiClass(el) {
  if (!el) return null;
  return Array.from(el.classList).find(function(c){ return /^pi\d$/.test(c); });
}

function setWash(cls) { wash.style.background = WASH[cls] || 'transparent'; }
function clearWash() { wash.style.background = 'transparent'; }

// Home / cart: wash on card hover
document.addEventListener('mouseover', function(e) {
  var card = e.target.closest('.pcard, .hcard, .mini-card');
  if (!card) return;
  var piEl = card.querySelector('[class*="pi1"],[class*="pi2"],[class*="pi3"],[class*="pi4"],[class*="pi5"],[class*="pi6"]');
  var cls = getPiClass(piEl) || getPiClass(card);
  if (cls) setWash(cls);
});
document.addEventListener('mouseout', function(e) {
  if (e.target.closest('.pcard, .hcard, .mini-card')) clearWash();
});

// Product page: persistent wash from current product's colour
var bm = document.querySelector('.prod-bm');
if (bm) {
  var cls = getPiClass(bm);
  if (cls) {
    wash.style.transition = 'background 1.4s ease';
    setWash(cls);
  }
}


// ── Chocolate snap sound (Web Audio, no external files) ───────────────────────
function playSnap() {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var len = Math.floor(ctx.sampleRate * 0.07);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
    }
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var hi = ctx.createBiquadFilter();
    hi.type = 'highpass'; hi.frequency.value = 1400;
    var peak = ctx.createBiquadFilter();
    peak.type = 'peaking'; peak.frequency.value = 3000; peak.gain.value = 8;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    src.connect(hi); hi.connect(peak); peak.connect(gain); gain.connect(ctx.destination);
    src.start();
  } catch(e) {}
}


// ── Shatter particles ─────────────────────────────────────────────────────────
var SHARD_COLORS = ['#c0830a', '#8b1a1a', '#4a2f10', '#d4960f'];

function shatterFrom(el) {
  var r = el.getBoundingClientRect();
  var cx = r.left + r.width / 2;
  var cy = r.top + r.height / 2;
  var count = 8;
  for (var i = 0; i < count; i++) {
    var s = document.createElement('div');
    var sz = 4 + Math.random() * 6;
    var color = SHARD_COLORS[Math.floor(Math.random() * SHARD_COLORS.length)];
    var w = i % 3 === 0 ? sz * 0.4 : sz;
    var h = i % 3 === 0 ? sz * 2.2 : sz;
    s.style.cssText = [
      'position:fixed',
      'width:' + w + 'px',
      'height:' + h + 'px',
      'background:' + color,
      'border-radius:1px',
      'left:' + cx + 'px',
      'top:' + cy + 'px',
      'transform:translate(-50%,-50%)',
      'pointer-events:none',
      'z-index:9999',
      'will-change:transform,opacity'
    ].join(';');
    document.body.appendChild(s);

    var ang = (i / count) * 360 + Math.random() * 20;
    var dist = 24 + Math.random() * 42;
    var dx = Math.cos(ang * Math.PI / 180) * dist;
    var dy = Math.sin(ang * Math.PI / 180) * dist - 10;

    (function(shard, ddx, ddy, dang) {
      requestAnimationFrame(function() {
        shard.style.transition = 'all 0.52s cubic-bezier(.1,.8,.25,1)';
        shard.style.transform = 'translate(calc(-50% + ' + ddx + 'px), calc(-50% + ' + ddy + 'px)) rotate(' + (dang * 1.8) + 'deg) scale(0)';
        shard.style.opacity = '0';
      });
      setTimeout(function(){ shard.remove(); }, 600);
    })(s, dx, dy, ang);
  }
}


// ── Cart badge bounce ─────────────────────────────────────────────────────────
var bStyle = document.createElement('style');
bStyle.textContent = [
  '@keyframes nml-badge-pop {',
  '  0%   { transform:scale(1); }',
  '  20%  { transform:scale(1.8); }',
  '  55%  { transform:scale(0.82); }',
  '  75%  { transform:scale(1.15); }',
  '  100% { transform:scale(1); }',
  '}',
  '.nml-badge-pop { animation: nml-badge-pop 0.42s cubic-bezier(.36,.07,.19,.97) !important; }'
].join('');
document.head.appendChild(bStyle);

function bounceBadge() {
  document.querySelectorAll('.cart-count').forEach(function(el) {
    el.classList.remove('nml-badge-pop');
    void el.offsetWidth;
    el.classList.add('nml-badge-pop');
    el.addEventListener('animationend', function() {
      el.classList.remove('nml-badge-pop');
    }, { once: true });
  });
}


// ── Wire to ATC buttons (capture phase fires before onclick) ──────────────────
document.addEventListener('click', function(e) {
  var btn = e.target.closest('.pcard-atc, .atc-btn, .cross-add');
  if (!btn) return;
  playSnap();
  shatterFrom(btn);
  setTimeout(bounceBadge, 55);
}, true);

}); // end DOMContentLoaded
