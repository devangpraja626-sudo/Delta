<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Delta — build your profile</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{
    --ink:#000000;
    --ink-2:#121212;
    --bone:#F5F5F5;
    --bone-dim:#9A9A9A;
    --brass:#D8D8D8;
    --brass-dim:#8A8A8A;
    --teal:#B8B8B8;
    --slate:#6E6E6E;
    --line: rgba(245,245,245,0.12);
    --radius: 3px;
  }
  *{box-sizing:border-box;}
  html{scroll-behavior:smooth;}
  body{
    margin:0;
    background:var(--ink);
    color:var(--bone);
    font-family:'IBM Plex Sans', sans-serif;
    -webkit-font-smoothing:antialiased;
  }
  @media (prefers-reduced-motion: reduce){
    *{animation-duration:0.01ms !important; transition-duration:0.01ms !important;}
  }

  .eyebrow{
    font-family:'IBM Plex Mono', monospace;
    font-size:11px;
    letter-spacing:0.14em;
    text-transform:uppercase;
    color:var(--brass);
  }

  /* NAV */
  nav{
    display:flex; align-items:center; justify-content:space-between;
    padding:22px 40px;
    border-bottom:1px solid var(--line);
  }
  .logo{
    display:flex; align-items:center; gap:10px;
    font-family:'Fraunces', serif; font-weight:600; font-size:19px;
    letter-spacing:0.01em;
  }
  .logo svg{display:block;}
  .nav-meta{
    font-family:'IBM Plex Mono', monospace;
    font-size:11px; color:var(--bone-dim); letter-spacing:0.06em;
  }
  .tagline{
    font-family:'IBM Plex Mono', monospace;
    font-size:10.5px; font-weight:400; letter-spacing:0.04em;
    color:var(--slate);
    padding-left:12px; margin-left:2px;
    border-left:1px solid var(--line);
    text-transform:none;
  }
  @media (max-width:720px){ .tagline{ display:none; } }

  /* HERO */
  .hero{
    padding:88px 40px 64px;
    max-width:1180px; margin:0 auto;
    display:grid; grid-template-columns: 1.15fr 0.85fr; gap:56px; align-items:center;
  }
  @media (max-width: 880px){ .hero{grid-template-columns:1fr; padding-top:56px;} }

  h1{
    font-family:'Fraunces', serif; font-weight:600;
    font-size:clamp(34px, 4.6vw, 58px);
    line-height:1.04; letter-spacing:-0.01em;
    margin:18px 0 22px;
  }
  h1 em{ font-style:italic; color:var(--brass); font-weight:500; }
  .hero p{
    font-size:16.5px; line-height:1.6; color:var(--bone-dim);
    max-width:46ch; margin:0 0 30px;
  }
  .hero-actions{display:flex; gap:14px; align-items:center;}
  .btn{
    font-family:'IBM Plex Sans', sans-serif; font-weight:500; font-size:14px;
    padding:13px 22px; border-radius:var(--radius);
    border:1px solid transparent; cursor:pointer;
    transition: transform .15s ease, background .15s ease, border-color .15s ease;
  }
  .btn:focus-visible{ outline:2px solid var(--teal); outline-offset:2px; }
  .btn-primary{ background:var(--brass); color:#0A0A0A; }
  .btn-primary:hover{ background:#EDEDED; transform:translateY(-1px); }
  .btn-ghost{ background:transparent; color:var(--bone); border-color:var(--line); }
  .btn-ghost:hover{ border-color:var(--bone-dim); }

  /* SIGNATURE CHART */
  .mark-card{
    border:1px solid var(--line); border-radius:6px;
    background:linear-gradient(180deg, var(--ink-2), var(--ink));
    padding:22px 22px 16px;
  }
  .mark-card .cap{
    display:flex; justify-content:space-between; align-items:baseline;
    font-family:'IBM Plex Mono', monospace; font-size:11px; color:var(--bone-dim);
    margin-bottom:6px; letter-spacing:0.05em;
  }
  .mark-card .cap .val{ color:var(--teal); }
  svg#sig{ width:100%; height:150px; display:block; }
  .sig-path{
    fill:none; stroke:var(--brass); stroke-width:2; stroke-linecap:round;
    stroke-dasharray: 600; stroke-dashoffset:600;
    transition: d 0.7s cubic-bezier(.4,0,.2,1);
    animation: draw 1.4s ease forwards;
  }
  @keyframes draw{ to{ stroke-dashoffset:0; } }
  .sig-dot{ fill:var(--teal); }

  /* SECTION LABEL */
  .section-head{ max-width:1180px; margin:0 auto; padding:8px 40px 0; }
  .section-head .eyebrow{ display:block; margin-bottom:10px; }
  .section-head h2{
    font-family:'Fraunces', serif; font-weight:600; font-size:clamp(24px,3vw,32px);
    margin:0 0 8px; letter-spacing:-0.01em;
  }
  .section-head p{ color:var(--bone-dim); font-size:15px; max-width:60ch; margin:0 0 32px; }

  /* ROLE PICKER — draggable icon board */
  .roles{
    max-width:1180px; margin:0 auto; padding:0 40px 20px;
  }
  .board{
    position:relative;
    border:1px dashed var(--line);
    border-radius:8px;
    background:
      radial-gradient(circle at 1px 1px, rgba(237,233,224,0.06) 1px, transparent 0) 0 0/28px 28px,
      var(--ink-2);
    height:320px;
    overflow:hidden;
  }
  @media (max-width:640px){ .board{ height:460px; } }

  .drop-zone{
    position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
    width:150px; height:150px; border-radius:50%;
    border:1px dashed var(--bone-dim);
    display:flex; align-items:center; justify-content:center; text-align:center;
    font-family:'IBM Plex Mono', monospace; font-size:10.5px; letter-spacing:0.08em;
    color:var(--slate); text-transform:uppercase; line-height:1.5;
    pointer-events:none; transition: border-color .2s ease, color .2s ease;
  }
  .drop-zone.armed{ border-color:var(--brass); color:var(--brass); border-style:solid; }

  .icon-tile{
    position:absolute;
    width:112px; height:112px;
    background:var(--ink); border:1px solid var(--line); border-radius:8px;
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;
    cursor:grab; touch-action:none; user-select:none;
    transition: border-color .18s ease, box-shadow .18s ease;
    font-family:'IBM Plex Mono', monospace; font-size:11px; letter-spacing:0.04em;
    color:var(--bone-dim);
  }
  .icon-tile:hover{ border-color:var(--bone-dim); }
  .icon-tile:focus-visible{ outline:2px solid var(--teal); outline-offset:2px; }
  .icon-tile.dragging{ cursor:grabbing; box-shadow:0 10px 30px rgba(0,0,0,0.4); z-index:5; }
  .icon-tile.active{ border-color:var(--brass); color:var(--brass); }
  .icon-tile svg{ width:30px; height:30px; }

  .role-copy{
    max-width:1180px; margin:14px auto 0; padding:0 40px;
    display:grid; grid-template-columns:repeat(3,1fr); gap:16px;
  }
  @media (max-width:820px){ .role-copy{grid-template-columns:1fr;} }
  .role-copy div{ padding:14px 4px; border-top:1px solid var(--line); }
  .role-copy .role-tick{
    font-family:'IBM Plex Mono', monospace; font-size:11px; color:var(--slate);
    display:block; margin-bottom:8px;
  }
  .role-copy .role-tick.active{ color:var(--brass); }
  .role-copy h3{ font-family:'Fraunces', serif; font-weight:600; font-size:19px; margin:0 0 6px; }
  .role-copy p{ font-size:13px; line-height:1.5; color:var(--bone-dim); margin:0; }
  .board-hint{
    font-family:'IBM Plex Mono', monospace; font-size:11px; color:var(--slate);
    margin:12px 4px 0; letter-spacing:0.04em;
  }

  /* FORM */
  .form-wrap{
    max-width:840px; margin:52px auto 0; padding:0 40px 100px;
    display:none;
  }
  .form-wrap.visible{ display:block; animation:fadeUp .45s ease; }
  @keyframes fadeUp{ from{opacity:0; transform:translateY(10px);} to{opacity:1; transform:translateY(0);} }

  .form-card{
    border:1px solid var(--line); border-radius:6px; background:var(--ink-2);
    padding:36px 36px 30px;
  }
  .form-card .role-tick{ margin-bottom:8px; }
  .form-card h3{ font-family:'Fraunces', serif; font-size:24px; font-weight:600; margin:0 0 28px; }

  .field{ margin-bottom:20px; }
  .field label{
    display:block; font-size:12.5px; font-weight:500; color:var(--bone-dim);
    margin-bottom:7px; letter-spacing:0.01em;
  }
  .field input, .field select, .field textarea{
    width:100%; background:var(--ink); border:1px solid var(--line); border-radius:var(--radius);
    color:var(--bone); font-family:'IBM Plex Sans', sans-serif; font-size:14.5px;
    padding:11px 13px; transition:border-color .15s ease;
  }
  .field textarea{ resize:vertical; min-height:84px; }
  .field input:focus, .field select:focus, .field textarea:focus{
    outline:none; border-color:var(--teal);
  }
  .field-row{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  @media (max-width:560px){ .field-row{grid-template-columns:1fr;} }
  .hint{ font-size:12px; color:var(--slate); margin-top:6px; }

  .form-footer{
    display:flex; justify-content:space-between; align-items:center;
    margin-top:8px; padding-top:22px; border-top:1px solid var(--line);
  }
  .progress{ font-family:'IBM Plex Mono', monospace; font-size:11px; color:var(--bone-dim); }
  .progress .val{ color:var(--teal); }

  footer{
    border-top:1px solid var(--line); padding:26px 40px;
    display:flex; justify-content:space-between; font-family:'IBM Plex Mono', monospace;
    font-size:11px; color:var(--slate);
  }
</style>
</head>
<body>

<nav>
  <div class="logo">
    <svg width="22" height="22" viewBox="0 0 22 22"><path d="M11 2 L20 19 L2 19 Z" fill="none" stroke="#D8D8D8" stroke-width="1.6"/><path d="M6 15 L10 9 L13 12 L17 6" fill="none" stroke="#8A8A8A" stroke-width="1.4" stroke-linecap="round"/></svg>
    Delta
    <span class="tagline">To promote entrepreneurship globally</span>
  </div>
  <div class="nav-meta">FOUNDER · INVESTOR · CONSULTANT NETWORK</div>
</nav>

<section class="hero">
  <div>
    <span class="eyebrow">01 — Build your profile</span>
    <h1>The right introduction <em>changes</em> everything.</h1>
    <p>Delta connects founders, investors, and the consultants who move deals forward — matched on stage, sector, and what you're actually looking for, not a cold inbox.</p>
    <div class="hero-actions">
      <button class="btn btn-primary" onclick="document.getElementById('roles').scrollIntoView()">Start your profile</button>
      <button class="btn btn-ghost">See how matching works</button>
    </div>
  </div>
  <div class="mark-card">
    <div class="cap"><span id="sigLabel">SELECT A ROLE</span><span class="val" id="sigVal">Δ —</span></div>
    <svg id="sig" viewBox="0 0 300 150" preserveAspectRatio="none">
      <path id="sigPath" class="sig-path" d="M10,120 C 80,110 150,100 290,20"/>
      <circle id="sigDot" class="sig-dot" cx="290" cy="20" r="4"/>
    </svg>
  </div>
</section>

<div class="section-head" id="roles">
  <span class="eyebrow">02 — Who are you</span>
  <h2>Pick your side of the table.</h2>
  <p>Your role sets the profile fields that matter — founders show traction and raise details, investors show thesis and check size, consultants show track record and focus.</p>
</div>

<div class="roles">
  <div class="board" id="board">
    <div class="drop-zone" id="dropZone">Drag your<br>role here</div>
    <div class="icon-tile" id="tile-founder" data-role="founder" tabindex="0" role="button" aria-label="Select Founder">
      <svg viewBox="0 0 32 32" fill="none"><path d="M16 4 L24 26 L16 21 L8 26 Z" stroke="#D8D8D8" stroke-width="1.6" stroke-linejoin="round"/><circle cx="16" cy="13" r="2.4" fill="#D8D8D8"/></svg>
      FOUNDER
    </div>
    <div class="icon-tile" id="tile-investor" data-role="investor" tabindex="0" role="button" aria-label="Select Investor">
      <svg viewBox="0 0 32 32" fill="none"><path d="M5 22 L12 14 L17 18 L27 6" stroke="#8A8A8A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 6 H27 V13" stroke="#8A8A8A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      INVESTOR
    </div>
    <div class="icon-tile" id="tile-consultant" data-role="consultant" tabindex="0" role="button" aria-label="Select Consultant">
      <svg viewBox="0 0 32 32" fill="none"><circle cx="8" cy="9" r="3" stroke="#9A9A9A" stroke-width="1.5"/><circle cx="24" cy="9" r="3" stroke="#9A9A9A" stroke-width="1.5"/><circle cx="16" cy="24" r="3" stroke="#9A9A9A" stroke-width="1.5"/><path d="M10.5 10.5 L14 21.5 M21.5 10.5 L18 21.5" stroke="#9A9A9A" stroke-width="1.3"/></svg>
      CONSULTANT
    </div>
  </div>
  <div class="board-hint">Drag a tile into the circle, or click / press enter to select.</div>

  <div class="role-copy">
    <div>
      <span class="role-tick" data-tick="founder">01 / RAISING</span>
      <h3>Founder</h3>
      <p>Looking for capital, and the investors and advisors who actually fit your stage and sector.</p>
    </div>
    <div>
      <span class="role-tick" data-tick="investor">02 / DEPLOYING</span>
      <h3>Investor</h3>
      <p>Deploying capital and want founders pre-matched to your thesis, stage, and check size.</p>
    </div>
    <div>
      <span class="role-tick" data-tick="consultant">03 / ADVISING</span>
      <h3>Consultant</h3>
      <p>Helping founders get raise-ready or helping investors run diligence — and want to be found.</p>
    </div>
  </div>
</div>

<!-- FOUNDER FORM -->
<div class="form-wrap" id="form-founder">
  <div class="form-card">
    <span class="role-tick">01 / RAISING</span>
    <h3>Founder profile</h3>
    <div class="field-row">
      <div class="field"><label for="f-name">Full name</label><input id="f-name" type="text" placeholder="Jordan Reyes"></div>
      <div class="field"><label for="f-company">Company</label><input id="f-company" type="text" placeholder="Company name"></div>
    </div>
    <div class="field-row">
      <div class="field">
        <label for="f-stage">Stage</label>
        <select id="f-stage">
          <option>Pre-seed</option><option>Seed</option><option>Series A</option><option>Series B+</option>
        </select>
      </div>
      <div class="field">
        <label for="f-sector">Sector</label>
        <input id="f-sector" type="text" placeholder="e.g. Fintech, Climate, Dev tools">
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label for="f-raise">Raising</label><input id="f-raise" type="text" placeholder="$500K target"></div>
      <div class="field"><label for="f-traction">Traction snapshot</label><input id="f-traction" type="text" placeholder="MRR, users, pilots"></div>
    </div>
    <div class="field">
      <label for="f-pitch">One-line pitch</label>
      <textarea id="f-pitch" placeholder="What you're building and for whom, in one sentence."></textarea>
    </div>
    <div class="form-footer">
      <span class="progress">FIELDS COMPLETE <span class="val">0/6</span></span>
      <button class="btn btn-primary">Continue</button>
    </div>
  </div>
</div>

<!-- INVESTOR FORM -->
<div class="form-wrap" id="form-investor">
  <div class="form-card">
    <span class="role-tick">02 / DEPLOYING</span>
    <h3>Investor profile</h3>
    <div class="field-row">
      <div class="field"><label for="i-name">Full name</label><input id="i-name" type="text" placeholder="Alex Chen"></div>
      <div class="field"><label for="i-firm">Firm (optional)</label><input id="i-firm" type="text" placeholder="Fund or angel"></div>
    </div>
    <div class="field-row">
      <div class="field">
        <label for="i-stage">Stage focus</label>
        <select id="i-stage">
          <option>Pre-seed</option><option>Seed</option><option>Series A</option><option>Series B+</option><option>Stage agnostic</option>
        </select>
      </div>
      <div class="field"><label for="i-check">Typical check size</label><input id="i-check" type="text" placeholder="$25K – $250K"></div>
    </div>
    <div class="field">
      <label for="i-thesis">Investment thesis</label>
      <textarea id="i-thesis" placeholder="Sectors, geographies, or patterns you look for."></textarea>
    </div>
    <div class="field"><label for="i-portfolio">Notable portfolio (optional)</label><input id="i-portfolio" type="text" placeholder="A few companies you've backed"></div>
    <div class="form-footer">
      <span class="progress">FIELDS COMPLETE <span class="val">0/6</span></span>
      <button class="btn btn-primary">Continue</button>
    </div>
  </div>
</div>

<!-- CONSULTANT FORM -->
<div class="form-wrap" id="form-consultant">
  <div class="form-card">
    <span class="role-tick">03 / ADVISING</span>
    <h3>Consultant profile</h3>
    <div class="field-row">
      <div class="field"><label for="c-name">Full name</label><input id="c-name" type="text" placeholder="Priya Nair"></div>
      <div class="field"><label for="c-focus">Focus area</label><input id="c-focus" type="text" placeholder="Fundraising, GTM, diligence..."></div>
    </div>
    <div class="field-row">
      <div class="field">
        <label for="c-side">Who you work with</label>
        <select id="c-side">
          <option>Founders</option><option>Investors</option><option>Both</option>
        </select>
      </div>
      <div class="field"><label for="c-rate">Engagement type</label><input id="c-rate" type="text" placeholder="Hourly, retainer, equity"></div>
    </div>
    <div class="field">
      <label for="c-track">Track record</label>
      <textarea id="c-track" placeholder="Deals closed, raises supported, or clients advised."></textarea>
    </div>
    <div class="form-footer">
      <span class="progress">FIELDS COMPLETE <span class="val">0/6</span></span>
      <button class="btn btn-primary">Continue</button>
    </div>
  </div>
</div>

<footer>
  <span>DELTA © 2026</span>
  <span>BECAUSE WE CARE ABOUT OUR FUTURE CREATORS</span>
</footer>

<script>
  const paths = {
    founder:    "M10,130 C 60,128 100,120 140,90 C 180,60 220,30 290,15",
    investor:   "M10,90 C 60,85 100,95 140,80 C 190,63 230,55 290,45",
    consultant: "M10,100 L80,60 L80,100 L160,40 L160,100 L230,55 L290,80"
  };
  const dots = { founder: {x:290,y:15}, investor: {x:290,y:45}, consultant: {x:290,y:80} };
  const labels = { founder: "FOUNDER TRAJECTORY", investor: "DEPLOYMENT CURVE", consultant: "NETWORK GRAPH" };
  const sigVals = { founder: "Δ +212%", investor: "Δ 14 deals", consultant: "Δ 38 intros" };

  const path = document.getElementById('sigPath');
  const dot = document.getElementById('sigDot');
  const sigLabel = document.getElementById('sigLabel');
  const sigVal = document.getElementById('sigVal');
  const board = document.getElementById('board');
  const dropZone = document.getElementById('dropZone');
  const tiles = document.querySelectorAll('.icon-tile');
  const ticks = document.querySelectorAll('.role-copy .role-tick');

  function selectRole(role, skipScroll){
    tiles.forEach(t => t.classList.toggle('active', t.dataset.role === role));
    ticks.forEach(t => t.classList.toggle('active', t.dataset.tick === role));
    document.querySelectorAll('.form-wrap').forEach(f => f.classList.remove('visible'));
    const target = document.getElementById('form-' + role);
    if(target){ target.classList.add('visible'); }

    path.style.animation = 'none';
    path.offsetHeight; // reflow to restart animation
    path.setAttribute('d', paths[role]);
    path.style.animation = 'draw 0.9s ease forwards';
    dot.setAttribute('cx', dots[role].x);
    dot.setAttribute('cy', dots[role].y);
    sigLabel.textContent = labels[role];
    sigVal.textContent = sigVals[role];

    if(!skipScroll) setTimeout(() => target.scrollIntoView({behavior:'smooth', block:'start'}), 150);
  }

  // Lay tiles out at fixed starting spots around the drop zone
  function layoutTiles(){
    const bw = board.clientWidth, bh = board.clientHeight;
    const positions = bw < 640
      ? [ {x: bw*0.5 - 56, y: 16}, {x: 16, y: bh - 128}, {x: bw - 128, y: bh - 128} ]
      : [ {x: 40, y: 24}, {x: bw - 152, y: 24}, {x: bw*0.5 - 56, y: bh - 136} ];
    tiles.forEach((tile, i) => {
      tile.style.left = positions[i].x + 'px';
      tile.style.top = positions[i].y + 'px';
    });
  }
  layoutTiles();
  window.addEventListener('resize', layoutTiles);

  // Drag handling (pointer events cover mouse + touch)
  let activeTile = null, offsetX = 0, offsetY = 0;

  function withinDropZone(tile){
    const tRect = tile.getBoundingClientRect();
    const dRect = dropZone.getBoundingClientRect();
    const tCenterX = tRect.left + tRect.width/2;
    const tCenterY = tRect.top + tRect.height/2;
    const dCenterX = dRect.left + dRect.width/2;
    const dCenterY = dRect.top + dRect.height/2;
    const dist = Math.hypot(tCenterX - dCenterX, tCenterY - dCenterY);
    return dist < (dRect.width/2 + 20);
  }

  tiles.forEach(tile => {
    tile.addEventListener('pointerdown', e => {
      activeTile = tile;
      tile.setPointerCapture(e.pointerId);
      tile.classList.add('dragging');
      const r = tile.getBoundingClientRect();
      offsetX = e.clientX - r.left;
      offsetY = e.clientY - r.top;
    });

    tile.addEventListener('pointermove', e => {
      if(activeTile !== tile) return;
      const bRect = board.getBoundingClientRect();
      let x = e.clientX - bRect.left - offsetX;
      let y = e.clientY - bRect.top - offsetY;
      x = Math.max(0, Math.min(x, board.clientWidth - tile.offsetWidth));
      y = Math.max(0, Math.min(y, board.clientHeight - tile.offsetHeight));
      tile.style.left = x + 'px';
      tile.style.top = y + 'px';
      dropZone.classList.toggle('armed', withinDropZone(tile));
    });

    function release(e){
      if(activeTile !== tile) return;
      tile.classList.remove('dragging');
      dropZone.classList.remove('armed');
      if(withinDropZone(tile)){
        selectRole(tile.dataset.role);
      }
      activeTile = null;
    }
    tile.addEventListener('pointerup', release);
    tile.addEventListener('pointercancel', release);

    // Click / keyboard selection as a non-drag alternative
    tile.addEventListener('click', () => { if(!tile.classList.contains('dragging')) selectRole(tile.dataset.role); });
    tile.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); selectRole(tile.dataset.role); }
    });
  });

  // live progress counters
  document.querySelectorAll('.form-card').forEach(card => {
    const inputs = card.querySelectorAll('input, select, textarea');
    const valEl = card.querySelector('.progress .val');
    function update(){
      let filled = 0;
      inputs.forEach(i => { if(i.value && i.value.trim() !== '') filled++; });
      valEl.textContent = filled + '/' + inputs.length;
    }
    inputs.forEach(i => i.addEventListener('input', update));
  });
</script>

</body>
</html>
