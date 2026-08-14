(function(){
  "use strict";

  /* ================= DATA ================= */
  const RARITIES = [
    { key:'gray',      name:'Обычная',     chance:0.50, items:['Какашка Чучкинс','Какашка Бетти','Миска риса','Лягушка','Памперс Джони'] },
    { key:'green',     name:'Необычная',   chance:0.30, items:['Попкинс Бетти','Попкинс Чучи','5 тенге','Лит Энерджи','Сюр Стриминг'] },
    { key:'purple',    name:'Редкая',      chance:0.10, items:['Шоколадка 5 рублей','Донер','Печенье','Шоколад «Озеро»','Обычная мармеладка'] },
    { key:'pink',      name:'Эпическая',   chance:0.05, items:['Киндер палочка','Мармеладка «Ленточка»','Сникерс','Флеш Махито'] },
    { key:'legendary', name:'Легендарная', chance:0.04, items:['Киндер Буэно Биг','Рафаэлка','Плитка шоколада','Чипсы с крабом'] },
    { key:'red',       name:'Мифическая',  chance:0.01, items:['Киндер Джой','Скин в Лиге','Донат ХСР','Кола'] },
  ];
  const ICONS = {
    'Какашка Чучкинс':'💩','Какашка Бетти':'💩','Миска риса':'🍚','Лягушка':'🐸','Памперс Джони':'🚼',
    'Попкинс Бетти':'🐕','Попкинс Чучи':'🐈\u200d⬛','5 тенге':'🪙','Лит Энерджи':'🥤','Сюр Стриминг':'📺',
    'Шоколадка 5 рублей':'🍫','Донер':'🌯','Печенье':'🍪','Шоколад «Озеро»':'🍬','Обычная мармеладка':'🍬',
    'Киндер палочка':'🍡','Мармеладка «Ленточка»':'🍭','Сникерс':'🍫','Флеш Махито':'🥤',
    'Киндер Буэно Биг':'🍫','Рафаэлка':'🌰','Плитка шоколада':'🍫','Чипсы с крабом':'🦀',
    'Киндер Джой':'🥚','Скин в Лиге':'🎮','Донат ХСР':'💎','Кола':'🥤',
  };
  const RARITY_ORDER = RARITIES.map(r=>r.key);
  const RARITY_HEX = { gray:'#9aa0a6', green:'#4caf7a', purple:'#a855f7', pink:'#ff5fa8', legendary:'#ffcf30', red:'#ff3b3b' };

  const LEGENDARY_POOL = ['Киндер Буэно Биг','Рафаэлка','Плитка шоколада','Чипсы с крабом'];
  const CASES = [
    { id:'case1', name:'Кейс Мурлыки',   icon:'🐾', accent:'#5ec8d8', legendaryPair:['Киндер Буэно Биг','Рафаэлка'] },
    { id:'case2', name:'Кейс Полуночи',  icon:'🌙', accent:'#a888ff', legendaryPair:['Плитка шоколада','Чипсы с крабом'] },
    { id:'case3', name:'Кейс Праздника', icon:'🎉', accent:'#ff9e6d', legendaryPair:['Киндер Буэно Биг','Чипсы с крабом'] },
    { id:'case4', name:'Кейс Дружбы',    icon:'💞', accent:'#7dd490', legendaryPair:['Рафаэлка','Плитка шоколада'] },
  ];

  const CAT_SPOTS = [
    { id:0, name:'Попкинс Чуча', emoji:'🐈\u200d⬛', place:'спит в кресле', placeEmoji:'🛋️', starter:true, cost:0, reward:10, sleeping:true, x:14, y:60 },
    { id:1, name:'Котик', emoji:'🐱', place:'у миски', placeEmoji:'🥣', cost:40,  reward:14, x:34, y:84 },
    { id:2, name:'Котик', emoji:'🐱', place:'на лежанке', placeEmoji:'🛏️', cost:90,  reward:20, x:60, y:64 },
    { id:3, name:'Котик', emoji:'🐱', place:'в коробке', placeEmoji:'📦', cost:160, reward:28, x:82, y:80 },
    { id:4, name:'Котик', emoji:'🐱', place:'на окне', placeEmoji:'🪟', cost:260, reward:38, x:50, y:14 },
    { id:5, name:'Котик', emoji:'🐱', place:'в корзинке', placeEmoji:'🧺', cost:400, reward:50, x:20, y:26 },
    { id:6, name:'Котик', emoji:'🐱', place:'на когтеточке', placeEmoji:'🌳', cost:600, reward:65, x:86, y:24 },
  ];
  const MAX_CATS = CAT_SPOTS.length;
  const CAT_TICK_MS = 5 * 60 * 1000; // 5 минут
  const MAX_OFFLINE_MS = 24 * 60 * 60 * 1000; // офлайн-фарм копится максимум за 24 часа

  /* ================= STATE ================= */
  let hearts = 0;
  const inventory = {};
  let unlockedCats = new Set([0]);
  let catNextTick = { 0: Date.now() + CAT_TICK_MS };
  let selectedCaseId = CASES[0].id;
  let tutorialSeen = false;

  function activeCase(){ return CASES.find(c=>c.id===selectedCaseId) || CASES[0]; }

  /* ================= SAVE / LOAD ================= */
  const SAVE_KEY = 'murchaschaya_fortuna_karina_save_v2';
  let storageAvailable = false;
  try{
    const t = '__ls_test__';
    localStorage.setItem(t,'1'); localStorage.removeItem(t);
    storageAvailable = true;
  }catch(e){ storageAvailable = false; }

  let saveTimer = null;
  function saveState(){
    if(!storageAvailable) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(()=>{
      try{
        const data = {
          hearts, inventory,
          unlockedCats: Array.from(unlockedCats),
          catNextTick, selectedCaseId, tutorialSeen,
          savedAt: Date.now()
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      }catch(e){}
    }, 250);
  }
  function loadState(){
    if(!storageAvailable) return false;
    try{
      const raw = localStorage.getItem(SAVE_KEY);
      if(!raw) return false;
      const data = JSON.parse(raw);
      if(typeof data.hearts === 'number') hearts = data.hearts;
      if(data.inventory && typeof data.inventory === 'object'){
        Object.keys(data.inventory).forEach(k=> inventory[k] = data.inventory[k]);
      }
      if(Array.isArray(data.unlockedCats) && data.unlockedCats.length){
        unlockedCats = new Set(data.unlockedCats);
      }
      if(data.catNextTick && typeof data.catNextTick === 'object'){
        catNextTick = data.catNextTick;
      }
      unlockedCats.forEach(id=>{ if(!(id in catNextTick)) catNextTick[id] = Date.now() + CAT_TICK_MS; });
      if(typeof data.selectedCaseId === 'string' && CASES.some(c=>c.id===data.selectedCaseId)){
        selectedCaseId = data.selectedCaseId;
      }
      if(typeof data.tutorialSeen === 'boolean') tutorialSeen = data.tutorialSeen;
      return true;
    }catch(e){ return false; }
  }
  const hadSave = loadState();

  /* offline farming catch-up: award hearts for time passed while the site was closed (capped at 24h) */
  function processOfflineEarnings(){
    const now = Date.now();
    let total = 0;
    unlockedCats.forEach(id=>{
      const spot = CAT_SPOTS.find(s=>s.id===id);
      if(!spot) return;
      const next = catNextTick[id];
      if(typeof next !== 'number'){ catNextTick[id] = now + CAT_TICK_MS; return; }
      if(now > next){
        const overdue = Math.min(now - next, MAX_OFFLINE_MS);
        const ticks = Math.floor(overdue / CAT_TICK_MS) + 1;
        total += ticks * spot.reward;
        catNextTick[id] = now + CAT_TICK_MS;
      }
    });
    if(total > 0) hearts += total;
    return total;
  }
  const offlineEarnings = hadSave ? processOfflineEarnings() : 0;

  let toastTimer = null;
  function showSaveToast(text){
    let toast = document.getElementById('saveToast');
    if(!toast){
      toast = document.createElement('div');
      toast.id = 'saveToast';
      toast.className = 'save-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> toast.classList.remove('show'), 1400);
  }

  /* ================= DOM REFS ================= */
  const heartView = document.getElementById('heartView');
  const heartCurrency = document.getElementById('heartCurrency');
  const catCountView = document.getElementById('catCountView');
  const catSlotsEl = document.getElementById('catSlots');
  const pull1Btn = document.getElementById('pull1');
  const pull10Btn = document.getElementById('pull10');
  const caseSelectEl = document.getElementById('caseSelect');

  function pulseHeart(){
    heartCurrency.classList.remove('pulse');
    void heartCurrency.offsetWidth;
    heartCurrency.classList.add('pulse');
  }

  function updateUI(){
    heartView.textContent = Math.floor(hearts);
    catCountView.textContent = unlockedCats.size;
    pull1Btn.disabled = hearts < 100;
    pull10Btn.disabled = hearts < 1000;
    saveState();
  }

  /* ================= AUDIO (synthesized) ================= */
  let actx;
  function ctx(){
    if(!actx) actx = new (window.AudioContext||window.webkitAudioContext)();
    return actx;
  }
  function tickSound(freq, vol){
    try{
      const c = ctx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.value = vol!==undefined?vol:0.05;
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.06);
      o.connect(g); g.connect(c.destination);
      o.start(); o.stop(c.currentTime + 0.07);
    }catch(e){}
  }
  function purrSound(){
    try{
      const c = ctx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.value = 90 + Math.random()*30;
      g.gain.value = 0.001;
      g.gain.linearRampToValueAtTime(0.04, c.currentTime+0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime+0.28);
      o.connect(g); g.connect(c.destination);
      o.start(); o.stop(c.currentTime+0.3);
    }catch(e){}
  }
  function revealChime(rarityKey, vol){
    try{
      const c = ctx();
      const notesByRarity = {
        gray:[440], green:[440,554], purple:[440,554,659],
        pink:[440,554,659,784], legendary:[392,523,659,784,988,1175],
        red:[392,494,587,740,988,1245,1568]
      };
      const notes = notesByRarity[rarityKey] || [440];
      const v = vol!==undefined?vol:0.09;
      notes.forEach((freq,i)=>{
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = 'triangle';
        o.frequency.value = freq;
        const t0 = c.currentTime + i*0.085;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(v, t0+0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0+0.5);
        o.connect(g); g.connect(c.destination);
        o.start(t0); o.stop(t0+0.55);
      });
    }catch(e){}
  }

  /* ================= CAT FARM (room scene) ================= */
  function renderCats(){
    catSlotsEl.innerHTML = '';
    CAT_SPOTS.forEach(spot=>{
      const owned = unlockedCats.has(spot.id);
      const el = document.createElement('div');
      el.className = 'cat-spot' + (spot.starter?' starter':'') + (!owned?' locked':'') + (owned&&spot.sleeping?' sleeping':'');
      el.style.left = spot.x + '%';
      el.style.top = spot.y + '%';
      el.dataset.catId = spot.id;

      let inner = `<div class="prop-emoji">${spot.placeEmoji}</div>`;
      if(owned){
        inner += `<div class="ring" data-ring="${spot.id}">`;
        inner += (spot.sleeping ? `<div class="z-sleep">Zzz</div>` : '');
        inner += `<div class="cat-emoji" data-pet="${spot.id}">${spot.emoji}</div>`;
        inner += `</div>`;
        inner += `<div class="spot-name">${spot.name}</div>`;
        inner += `<div class="spot-place">${spot.place}</div>`;
      } else {
        inner += `<div class="ring locked-ring"><div class="cat-emoji">🔒</div></div>`;
        inner += `<div class="spot-place">${spot.place}</div>`;
        inner += `<div class="adopt-chip" data-adopt="${spot.id}">💗${spot.cost}</div>`;
      }
      el.innerHTML = inner;
      catSlotsEl.appendChild(el);
    });

    catSlotsEl.querySelectorAll('[data-pet]').forEach(catEl=>{
      catEl.addEventListener('click', (e)=> petCat(e, catEl, Number(catEl.dataset.pet)));
    });
    catSlotsEl.querySelectorAll('[data-adopt]').forEach(chip=>{
      chip.addEventListener('click', ()=> adoptCat(Number(chip.dataset.adopt)));
    });

    maybeShowTutorial();
    updateProgressBars();
  }

  function petCat(e, catEl, catId){
    hearts += 1;
    updateUI();
    pulseHeart();
    purrSound();
    const rect = catEl.getBoundingClientRect();
    const f = document.createElement('div');
    f.className = 'floatie';
    f.textContent = '+1 💗';
    f.style.left = (rect.left + rect.width/2 - 16) + 'px';
    f.style.top = (rect.top - 4) + 'px';
    document.body.appendChild(f);
    setTimeout(()=> f.remove(), 1000);
    catEl.style.transform = 'scale(0.85)';
    setTimeout(()=> catEl.style.transform = '', 120);
  }

  function adoptCat(catId){
    const spot = CAT_SPOTS.find(s=>s.id===catId);
    if(!spot || unlockedCats.has(catId)) return;
    if(hearts < spot.cost) return;
    hearts -= spot.cost;
    unlockedCats.add(catId);
    catNextTick[catId] = Date.now() + CAT_TICK_MS;
    updateUI();
    renderCats();
  }

  function updateProgressBars(){
    const now = Date.now();
    unlockedCats.forEach(id=>{
      const ring = catSlotsEl.querySelector(`[data-ring="${id}"]`);
      if(!ring) return;
      const next = catNextTick[id] || (now + CAT_TICK_MS);
      const remain = Math.max(0, next - now);
      const pct = Math.min(100, ((CAT_TICK_MS - remain) / CAT_TICK_MS) * 100);
      ring.style.background = `conic-gradient(var(--pink) ${pct}%, rgba(255,255,255,.12) 0)`;
    });
  }

  setInterval(()=>{
    const now = Date.now();
    let changed = false;
    unlockedCats.forEach(id=>{
      const spot = CAT_SPOTS.find(s=>s.id===id);
      if(!spot) return;
      const next = catNextTick[id] || (now + CAT_TICK_MS);
      if(now >= next){
        hearts += spot.reward;
        catNextTick[id] = now + CAT_TICK_MS;
        changed = true;
        const catEl = catSlotsEl.querySelector(`[data-pet="${id}"]`);
        if(catEl){
          const rect = catEl.getBoundingClientRect();
          const f = document.createElement('div');
          f.className = 'floatie';
          f.textContent = '+' + spot.reward + ' 💗';
          f.style.left = (rect.left + rect.width/2 - 20) + 'px';
          f.style.top = (rect.top - 4) + 'px';
          document.body.appendChild(f);
          setTimeout(()=> f.remove(), 1000);
        }
      }
    });
    updateProgressBars();
    if(changed){ pulseHeart(); updateUI(); }
  }, 1000);

  function maybeShowTutorial(){
    if(tutorialSeen) return;
    const starterEl = catSlotsEl.querySelector('.cat-spot.starter');
    if(!starterEl || starterEl.querySelector('.tutorial-bubble')) return;
    const bubble = document.createElement('div');
    bubble.className = 'tutorial-bubble';
    bubble.innerHTML = `Мяу! Я <b>Попкинс Чуча</b> 🐈\u200d⬛<br>Погладь меня — получишь +1💗. А ещё я и другие котики сами приносим сердечки раз в 5 минут, даже пока сайт закрыт.<br>Собери 100💗 и открой свою первую крутку удачи ✦<span class="tb-close">поняла, мур!</span>`;
    starterEl.style.position = 'relative';
    starterEl.appendChild(bubble);
    bubble.querySelector('.tb-close').addEventListener('click', (e)=>{
      e.stopPropagation();
      tutorialSeen = true;
      bubble.remove();
      saveState();
    });
  }

  /* ================= AMBIENT FLOATING HEARTS ================= */
  const AMB_GLYPHS = ['💗','✨','🐾','💫'];
  let ambCount = 0;
  setInterval(()=>{
    if(ambCount > 14) return;
    const el = document.createElement('div');
    el.className = 'amb-heart';
    el.textContent = AMB_GLYPHS[Math.floor(Math.random()*AMB_GLYPHS.length)];
    el.style.left = Math.random()*100 + '%';
    el.style.fontSize = (10 + Math.random()*12) + 'px';
    const dur = 8 + Math.random()*7;
    el.style.animationDuration = dur + 's';
    document.body.appendChild(el);
    ambCount++;
    setTimeout(()=>{ el.remove(); ambCount--; }, dur*1000);
  }, 900);

  /* ================= CASE SELECT UI ================= */
  function renderCaseSelect(){
    caseSelectEl.innerHTML = '';
    CASES.forEach(c=>{
      const card = document.createElement('div');
      card.className = 'case-card' + (c.id===selectedCaseId?' selected':'');
      card.style.setProperty('--accent', c.accent);
      card.innerHTML = `<div class="case-icon">${c.icon}</div><div class="case-name">${c.name}</div>`;
      card.addEventListener('click', ()=>{
        selectedCaseId = c.id;
        renderCaseSelect();
        saveState();
      });
      caseSelectEl.appendChild(card);
    });
  }

  /* ================= GACHA LOGIC ================= */
  function weightedPick(){
    let r = Math.random(), cum = 0;
    for(const rar of RARITIES){
      cum += rar.chance;
      if(r <= cum) return rar;
    }
    return RARITIES[0];
  }
  function pickItemForCase(rar, caseObj){
    if(rar.key === 'legendary'){
      const pool = caseObj.legendaryPair;
      return pool[Math.floor(Math.random()*pool.length)];
    }
    return rar.items[Math.floor(Math.random()*rar.items.length)];
  }
  function isMysteryRarity(key){ return key === 'red'; }
  function iconFor(rar, itemName){
    if(isMysteryRarity(rar.key)) return '❓';
    return ICONS[itemName] || '✦';
  }
  function addToInventory(name){
    inventory[name] = (inventory[name]||0) + 1;
    renderInventory();
    saveState();
  }

  function renderInventory(){
    const wrap = document.getElementById('invGroups');
    wrap.innerHTML = '';
    let any = false;
    RARITIES.forEach(rar=>{
      const owned = rar.items.filter(it=> inventory[it]);
      if(owned.length === 0) return;
      any = true;
      const group = document.createElement('div');
      group.className = 'inv-group rarity-' + rar.key;
      const h3 = document.createElement('h3');
      h3.textContent = rar.name;
      group.appendChild(h3);
      const row = document.createElement('div');
      row.className = 'inv-row';
      owned.forEach(it=>{
        const chip = document.createElement('div');
        chip.className = 'inv-chip';
        chip.innerHTML = `<span>${iconFor(rar,it)}</span><span>${it}</span><span class="cnt">×${inventory[it]}</span>`;
        row.appendChild(chip);
      });
      group.appendChild(row);
      wrap.appendChild(group);
    });
    if(!any){
      wrap.innerHTML = '<div class="inv-empty">Пока пусто — покрути гачу и собери коллекцию 🐾</div>';
    }
  }

  function easeOutQuart(t){ return 1 - Math.pow(1-t, 4); }
  function getComputedRarityColor(key){ return RARITY_HEX[key] || '#ffd66b'; }

  /* generic strip-spin runner used by both single pull and mini-cases */
  function runCaseSpin(cfg){
    const {
      stripEl, viewportEl, finalRarity, finalItem, caseObj,
      itemW, stripLen, landIndex, duration, playTicks, onLand
    } = cfg;

    stripEl.innerHTML = '';
    stripEl.style.transform = 'translateX(0px)';
    const isSingle = itemW >= 140;
    for(let i=0;i<stripLen;i++){
      let rar, itemName;
      if(i === landIndex){ rar = finalRarity; itemName = finalItem; }
      else { rar = weightedPick(); itemName = pickItemForCase(rar, caseObj); }
      const cell = document.createElement('div');
      const mysteryCls = isMysteryRarity(rar.key) ? ' mystery-tier' : '';
      cell.className = (isSingle ? 'strip-item' : 'mini-item') + ' rarity-' + rar.key + mysteryCls;
      const iconClass = isSingle ? 'item-icon' : 'mi-icon';
      const nameClass = isSingle ? 'item-name' : 'mi-name';
      cell.innerHTML = `<div class="${iconClass}">${iconFor(rar,itemName)}</div><div class="${nameClass}">${itemName}</div>`;
      stripEl.appendChild(cell);
    }

    const viewportWidth = viewportEl.clientWidth;
    const jitter = (Math.random()*0.5 - 0.25) * itemW;
    const targetX = landIndex*itemW + itemW/2 - viewportWidth/2 + jitter;
    const start = performance.now();
    let lastTickIndex = -1;
    let raf = null;
    let done = false;

    function land(){
      if(done) return;
      done = true;
      viewportEl.classList.remove('near-land');
      viewportEl.classList.add('landed');
      viewportEl.style.setProperty('--flashClr', 'var(--clr)');
      viewportEl.classList.add('rarity-' + finalRarity.key);
      onLand && onLand();
    }

    let resolveFn = null;
    const promise = new Promise((resolve)=>{
      resolveFn = resolve;
      function frame(now){
        if(done) return;
        const t = Math.min(1, (now-start)/duration);
        const eased = easeOutQuart(t);
        const x = targetX * eased;
        stripEl.style.transform = `translateX(${-x}px)`;

        if(t > 0.8 && !viewportEl.classList.contains('near-land')){
          viewportEl.style.setProperty('--flashClr', getComputedRarityColor(finalRarity.key));
          viewportEl.classList.add('near-land');
        }
        const idx = Math.floor(x / itemW);
        if(idx !== lastTickIndex){
          lastTickIndex = idx;
          if(playTicks){
            const pitch = 500 + Math.min(500, (1-t)*900);
            tickSound(pitch, 0.045);
          }
        }
        if(t < 1){
          raf = requestAnimationFrame(frame);
        } else {
          land();
          resolve();
        }
      }
      raf = requestAnimationFrame(frame);
    });

    function cancel(){
      if(done) return;
      if(raf) cancelAnimationFrame(raf);
      stripEl.style.transform = `translateX(${-targetX}px)`;
      land();
      if(resolveFn) resolveFn();
    }

    return { promise, cancel };
  }

  function burstConfetti(container, rarityKey){
    const glyphs = rarityKey==='red' ? ['💖','✨','🎉','💗','❓'] : rarityKey==='legendary' ? ['✨','⭐','💛','🌟'] : ['💕','✨'];
    const count = rarityKey==='red' ? 26 : rarityKey==='legendary' ? 24 : 20;
    for(let i=0;i<count;i++){
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.textContent = glyphs[Math.floor(Math.random()*glyphs.length)];
      const angle = Math.random()*Math.PI*2;
      const dist = 90 + Math.random()*140;
      p.style.setProperty('--dx', Math.cos(angle)*dist + 'px');
      p.style.setProperty('--dy', Math.sin(angle)*dist + 'px');
      p.style.setProperty('--rot', (Math.random()*360)+'deg');
      p.style.left = '50%'; p.style.top = '50%';
      container.appendChild(p);
      setTimeout(()=> p.remove(), 1300);
    }
  }

  function addLegendRays(container, rarColor){
    const rays = document.createElement('div');
    rays.className = 'legend-rays';
    for(let i=0;i<10;i++){
      const ray = document.createElement('div');
      ray.className = 'ray';
      ray.style.transform = `rotate(${i*36}deg)`;
      ray.style.animationDelay = (i*0.05)+'s';
      rays.appendChild(ray);
    }
    container.appendChild(rays);
    setTimeout(()=> rays.remove(), 2600);
  }

  /* ================= SINGLE PULL ================= */
  const caseOverlay = document.getElementById('caseOverlay');
  const caseOverlayTitle = document.getElementById('caseOverlayTitle');
  const caseViewport = document.getElementById('caseViewport');
  const stripEl = document.getElementById('strip');
  const revealCard = document.getElementById('revealCard');
  const skipAnimBtn = document.getElementById('skipAnim');
  const closeCaseBtn = document.getElementById('closeCase');
  const confettiBurst = document.getElementById('confettiBurst');

  let singleController = null;

  function finishSingleReveal(rar, item){
    revealChime(rar.key, 0.1);
    revealCard.innerHTML = `
      <div class="reveal-icon rarity-${rar.key}${rar.key==='legendary'?' legend-flash':''}">${iconFor(rar,item)}</div>
      <div class="reveal-rarity rarity-${rar.key}">${rar.name}</div>
      <div class="reveal-name">${item}</div>`;
    revealCard.removeAttribute('hidden');
    closeCaseBtn.removeAttribute('hidden');
    skipAnimBtn.setAttribute('hidden','');

    if(rar.key==='legendary'){
      burstConfetti(confettiBurst, rar.key);
      addLegendRays(revealCard.querySelector('.reveal-icon'), getComputedRarityColor(rar.key));
      caseOverlay.classList.remove('shake'); void caseOverlay.offsetWidth; caseOverlay.classList.add('shake');
    } else if(rar.key==='red'){
      burstConfetti(confettiBurst, rar.key);
      caseOverlay.classList.remove('bigshake'); void caseOverlay.offsetWidth; caseOverlay.classList.add('bigshake');
      caseOverlay.classList.remove('mythic-vignette'); void caseOverlay.offsetWidth; caseOverlay.classList.add('mythic-vignette');
    } else if(rar.key==='pink'){
      burstConfetti(confettiBurst, rar.key);
    }
    addToInventory(item);
  }

  function openSinglePull(){
    if(hearts < 100) return;
    hearts -= 100;
    updateUI();
    pulseHeart();
    const cs = activeCase();
    const rar = weightedPick();
    const item = pickItemForCase(rar, cs);

    caseOverlayTitle.textContent = `${cs.icon} ${cs.name}`;
    caseOverlay.removeAttribute('hidden');
    revealCard.setAttribute('hidden','');
    closeCaseBtn.setAttribute('hidden','');
    skipAnimBtn.removeAttribute('hidden');
    confettiBurst.innerHTML = '';
    caseViewport.className = 'case-viewport';

    singleController = runCaseSpin({
      stripEl, viewportEl: caseViewport, finalRarity: rar, finalItem: item, caseObj: cs,
      itemW: 150, stripLen: 60, landIndex: 48, duration: 4200, playTicks: true,
      onLand: ()=> finishSingleReveal(rar, item)
    });

    skipAnimBtn.onclick = ()=>{ if(singleController) singleController.cancel(); };
  }
  closeCaseBtn.addEventListener('click', ()=>{
    caseOverlay.setAttribute('hidden','');
    caseOverlay.classList.remove('mythic-vignette');
  });
  pull1Btn.addEventListener('click', openSinglePull);

  /* ================= MULTI PULL: 5 cases x 2 waves ================= */
  const multiOverlay = document.getElementById('multiOverlay');
  const multiCases = document.getElementById('multiCases');
  const waveLabel = document.getElementById('waveLabel');
  const waveDots = document.querySelectorAll('.wave-dot');
  const skipMultiBtn = document.getElementById('skipMulti');
  const closeMultiBtn = document.getElementById('closeMulti');

  let activeControllers = [];
  let skipAllRequested = false;
  let waitResolve = null;

  function sleep(ms){
    return new Promise((resolve)=>{
      if(skipAllRequested){ resolve(); return; }
      waitResolve = resolve;
      setTimeout(()=>{ if(waitResolve){ waitResolve = null; resolve(); } }, ms);
    });
  }

  function buildMiniCaseRows(){
    multiCases.innerHTML = '';
    const rows = [];
    for(let i=0;i<5;i++){
      const row = document.createElement('div');
      row.className = 'mini-case';
      row.innerHTML = `
        <div class="mini-tag">${i+1}</div>
        <div class="mini-viewport">
          <div class="mini-marker"></div>
          <div class="mini-strip"></div>
        </div>`;
      multiCases.appendChild(row);
      rows.push({ viewportEl: row.querySelector('.mini-viewport'), stripEl: row.querySelector('.mini-strip') });
    }
    return rows;
  }

  async function runWave(waveResults, waveNum, caseObj){
    waveLabel.textContent = `Волна ${waveNum} из 2`;
    waveDots.forEach(d=> d.classList.toggle('active', Number(d.dataset.wave) === waveNum));
    const rows = buildMiniCaseRows();

    const controllers = waveResults.map((res, i)=>{
      const duration = 3600 + Math.random()*1100 + i*90;
      return runCaseSpin({
        stripEl: rows[i].stripEl, viewportEl: rows[i].viewportEl,
        finalRarity: res.rar, finalItem: res.item, caseObj,
        itemW: 100, stripLen: 36, landIndex: 28, duration,
        playTicks: i === 0,
        onLand: ()=>{
          revealChime(res.rar.key, 0.05);
          addToInventory(res.item);
          if(res.rar.key === 'legendary'){
            multiOverlay.classList.remove('shake'); void multiOverlay.offsetWidth; multiOverlay.classList.add('shake');
          } else if(res.rar.key === 'red'){
            multiOverlay.classList.remove('bigshake'); void multiOverlay.offsetWidth; multiOverlay.classList.add('bigshake');
            multiOverlay.classList.remove('mythic-vignette'); void multiOverlay.offsetWidth; multiOverlay.classList.add('mythic-vignette');
          }
        }
      });
    });
    activeControllers = controllers;
    if(skipAllRequested){ controllers.forEach(c=> c.cancel()); }
    await Promise.all(controllers.map(c=>c.promise));
    activeControllers = [];
  }

  async function openTenPull(){
    if(hearts < 1000) return;
    hearts -= 1000;
    updateUI();
    pulseHeart();
    const cs = activeCase();

    const all = [];
    for(let i=0;i<10;i++){
      const rar = weightedPick();
      const item = pickItemForCase(rar, cs);
      all.push({ rar, item });
    }
    all.sort((a,b)=> RARITY_ORDER.indexOf(a.rar.key) - RARITY_ORDER.indexOf(b.rar.key));
    const wave1 = all.slice(0,5);
    const wave2 = all.slice(5,10);

    multiOverlay.removeAttribute('hidden');
    closeMultiBtn.setAttribute('hidden','');
    skipMultiBtn.removeAttribute('hidden');
    skipAllRequested = false;

    await runWave(wave1, 1, cs);
    await sleep(900);
    await runWave(wave2, 2, cs); // if skip was requested, runWave resolves instantly

    closeMultiBtn.removeAttribute('hidden');
    skipMultiBtn.setAttribute('hidden','');
  }

  skipMultiBtn.addEventListener('click', ()=>{
    skipAllRequested = true;
    if(activeControllers.length){ activeControllers.forEach(c=> c.cancel()); }
    if(waitResolve){ const r = waitResolve; waitResolve = null; r(); }
  });
  closeMultiBtn.addEventListener('click', ()=>{
    multiOverlay.setAttribute('hidden','');
    multiOverlay.classList.remove('mythic-vignette');
  });
  pull10Btn.addEventListener('click', openTenPull);

  /* ================= RESET PROGRESS ================= */
  const resetLink = document.getElementById('resetLink');
  let resetArmed = false;
  let resetArmTimer = null;
  resetLink.addEventListener('click', ()=>{
    if(!resetArmed){
      resetArmed = true;
      resetLink.textContent = 'точно всё стереть? нажми ещё раз';
      clearTimeout(resetArmTimer);
      resetArmTimer = setTimeout(()=>{ resetArmed = false; resetLink.textContent = 'сбросить прогресс'; }, 3000);
      return;
    }
    try{ localStorage.removeItem(SAVE_KEY); }catch(e){}
    location.reload();
  });

  /* ================= STARFIELD ================= */
  const starfield = document.getElementById('starfield');
  for(let i=0;i<55;i++){
    const s = document.createElement('div');
    s.className = 'star';
    const size = Math.random()*2 + 1;
    s.style.width = size+'px';
    s.style.height = size+'px';
    s.style.left = Math.random()*100+'%';
    s.style.top = Math.random()*100+'%';
    s.style.animationDelay = (Math.random()*3.5)+'s';
    starfield.appendChild(s);
  }

  /* ================= RAINBOW BACKGROUND ================= */
  function buildRainbowBg(){
    const container = document.getElementById('rainbowBg');
    if(!container) return;
    const PURPLE = 'rgb(232,121,249)', BLUE = 'rgb(96,165,250)', GREEN = 'rgb(94,234,212)';
    const PERMS = [
      [PURPLE,BLUE,GREEN], [PURPLE,GREEN,BLUE], [GREEN,PURPLE,BLUE],
      [GREEN,BLUE,PURPLE], [BLUE,GREEN,PURPLE], [BLUE,PURPLE,GREEN]
    ];
    const ANIM_TIME = 45, LENGTH = 25;
    for(let i=1;i<=LENGTH;i++){
      const perm = PERMS[Math.floor(Math.random()*PERMS.length)];
      const beam = document.createElement('div');
      beam.className = 'rainbow-beam';
      beam.style.boxShadow =
        `-130px 0 80px 40px rgba(255,255,255,.4), -50px 0 50px 25px ${perm[0]}, ` +
        `0 0 50px 25px ${perm[1]}, 50px 0 50px 25px ${perm[2]}, 130px 0 80px 40px rgba(255,255,255,.4)`;
      const duration = ANIM_TIME - (ANIM_TIME/LENGTH/2)*i;
      const delay = -(i/LENGTH*ANIM_TIME);
      beam.style.animation = `rainbow-slide ${duration}s linear infinite`;
      beam.style.animationDelay = `${delay}s`;
      container.appendChild(beam);
    }
  }
  buildRainbowBg();

  /* ================= INIT ================= */
  renderCaseSelect();
  renderCats();
  renderInventory();
  updateUI();
  if(offlineEarnings > 0){
    showSaveToast(`Пока тебя не было, котики принесли +${offlineEarnings}💗 ✓`);
  } else if(hadSave){
    showSaveToast('С возвращением! Прогресс загружен ✓');
  }
})();
