// ─── No Marks Left — Frontend Interactions ───────────────────────────────────
// Chocolate snap sound + shatter particles + badge bounce on add-to-cart

document.addEventListener('DOMContentLoaded', function() {

// ── Chocolate snap sound (two-layer: mid crack + low body) ────────────────────
function playSnap() {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Layer 1: mid-range crack — the actual snap character
    var len1 = Math.floor(ctx.sampleRate * 0.13);
    var buf1 = ctx.createBuffer(1, len1, ctx.sampleRate);
    var d1 = buf1.getChannelData(0);
    for (var i = 0; i < len1; i++) {
      d1[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len1, 1.6);
    }
    var src1 = ctx.createBufferSource();
    src1.buffer = buf1;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 950; bp.Q.value = 1.0;
    var g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.42, ctx.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    src1.connect(bp); bp.connect(g1); g1.connect(ctx.destination);
    src1.start();

    // Layer 2: low thump — gives it weight and richness
    var len2 = Math.floor(ctx.sampleRate * 0.07);
    var buf2 = ctx.createBuffer(1, len2, ctx.sampleRate);
    var d2 = buf2.getChannelData(0);
    for (var j = 0; j < len2; j++) {
      d2[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / len2, 2.8);
    }
    var src2 = ctx.createBufferSource();
    src2.buffer = buf2;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 280;
    var g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.28, ctx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
    src2.connect(lp); lp.connect(g2); g2.connect(ctx.destination);
    src2.start();

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
