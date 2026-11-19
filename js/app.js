/* 은지님네 냉장고 — data.json 하나만 고치면 화면이 바뀝니다 */
(() => {
  'use strict';

  const TABS = [
    { id: 'all',    label: '전체 보기', icon: '🏠' },
    { id: 'week',   label: '주간 식단', icon: '📅' },
    { id: 'cold',   label: '냉장실',    icon: '❄️' },
    { id: 'frozen', label: '냉동실',    icon: '🧊' },
    { id: 'kimchi', label: '김치냉장고', icon: '🥬' },
    { id: 'simple', label: '간단 식단', icon: '🍳' },
    { id: 'shop',   label: '장보기',    icon: '🛒' }
  ];

  const LOCS = {
    cold:   { label: '냉장실',      icon: '❄️', short: '냉장' },
    frozen: { label: '냉동실',      icon: '🧊', short: '냉동' },
    kimchi: { label: '김치냉장고',  icon: '🥬', short: '김냉' }
  };

  const CATS = [
    { id: 'all',     label: '전체' },
    { id: 'fruit',   label: '과일·간식' },
    { id: 'veg',     label: '채소·버섯' },
    { id: 'protein', label: '달걀·유제품·고기' },
    { id: 'kimchi',  label: '김치·반찬·양념' },
    { id: 'kids',    label: '아이 맞춤' },
    { id: 'meal',    label: '밀키트·간편식' }
  ];

  const CAT_ORDER = CATS.filter(c => c.id !== 'all');
  const EATEN_KEY = 'fridge.eaten.v1';
  const SHOP_KEY = 'fridge.shop.v1';

  const state = { tab: 'all', cat: 'all', query: '', data: null };

  const $ = (sel, root = document) => root.querySelector(sel);
  const view = $('#view');

  /* ---------- storage ---------- */
  function load(key) {
    try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* 사생활 보호 모드 등 */ }
  }

  let eaten = load(EATEN_KEY);
  let checked = load(SHOP_KEY);

  /* ---------- helpers ---------- */
  function esc(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatUpdated(iso) {
    if (!iso) return '—';
    try {
      const parts = new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', weekday: 'short',
        hour: 'numeric', minute: '2-digit', hour12: true
      }).formatToParts(new Date(iso));
      const p = {};
      parts.forEach(x => { if (x.type !== 'literal') p[x.type] = x.value; });
      const day = String(p.day || '').replace(/\D/g, '');
      return `${p.month}/${day} (${p.weekday}) ${p.dayPeriod || ''} ${p.hour}:${String(p.minute || '').padStart(2, '0')}`.replace(/\s+/g, ' ').trim();
    } catch (e) {
      return iso.slice(0, 10);
    }
  }

  const DAY_KO = ['일', '월', '화', '수', '목', '금', '토'];
  function dayOf(dateStr) {
    const d = new Date(dateStr + 'T12:00:00+09:00');
    return DAY_KO[d.getDay()];
  }

  function items() { return state.data.items || []; }
  function countByLoc(loc) { return items().filter(i => i.loc === loc).length; }
  function countTag(tag) { return items().filter(i => (i.tags || []).includes(tag)).length; }

  function matches(item) {
    if (state.cat !== 'all' && item.cat !== state.cat) return false;
    const q = state.query.trim().toLowerCase();
    if (!q) return true;
    return (item.name + ' ' + (item.qty || '') + ' ' + (item.note || '')).toLowerCase().includes(q);
  }

  /* ---------- header ---------- */
  function renderHeader() {
    const d = state.data;
    $('#heroTitle').textContent = d.title || '은지님네 냉장고';
    $('#heroSub').textContent = d.subtitle || '냉장실 · 냉동실 · 김치냉장고 재료를 한 번에 볼 수 있어요';
    $('#updated').textContent = formatUpdated(d.updatedAt);
    $('#itemTotal').textContent = items().length;

    const badges = [
      { cls: 'cold',   ico: '❄️', label: LOCS.cold.short,   n: countByLoc('cold') },
      { cls: 'frozen', ico: '🧊', label: LOCS.frozen.short, n: countByLoc('frozen') },
      { cls: 'kimchi', ico: '🥬', label: LOCS.kimchi.short, n: countByLoc('kimchi') },
      { cls: 'eat',   ico: '🔥', label: '우선 소진',        n: countTag('우선 소진') },
      { cls: 'soon',  ico: '⏰', label: '임박',             n: countTag('임박') }
    ];
    $('#summary').innerHTML = badges.map(b => `
      <span class="badge badge--${b.cls}">
        <span class="badge-ico" aria-hidden="true">${b.ico}</span>${esc(b.label)} <b>${b.n}</b>
      </span>`).join('');
  }

  /* ---------- tabs ---------- */
  function renderTabs() {
    $('#tabs').innerHTML = TABS.map(t => `
      <button type="button" class="tab${state.tab === t.id ? ' is-active' : ''}" data-tab="${t.id}"
        aria-current="${state.tab === t.id ? 'page' : 'false'}">
        <span class="tab-ico" aria-hidden="true">${t.icon}</span>
        <span>${esc(t.label)}</span>
      </button>`).join('');
  }

  /* ---------- search + chips ---------- */
  function searchBar() {
    return `
      <div class="search">
        <span class="s-ico" aria-hidden="true">🔍</span>
        <input id="searchInput" type="search" autocomplete="off"
          placeholder="재료 검색 (예: 우유, 배추)" value="${esc(state.query)}" aria-label="재료 검색" />
        ${state.query ? '<button type="button" class="search-clear" data-clear="1" aria-label="검색어 지우기">✕</button>' : ''}
      </div>`;
  }

  function chipBar() {
    return `<div class="chips">${CATS.map(c => `
      <button type="button" class="chip${state.cat === c.id ? ' is-active' : ''}" data-cat="${c.id}">${esc(c.label)}</button>
    `).join('')}</div>`;
  }

  /* ---------- meal plan ---------- */
  function mealCard(card) {
    const isEaten = !!eaten[card.id];
    const whoCls = card.whoIcon === '🧸' ? ' who-chip--kids' : (card.whoIcon === '🏠' ? ' who-chip--family' : '');
    return `
      <article class="meal-card${isEaten ? ' is-eaten' : ''}" data-meal-id="${esc(card.id)}">
        <div class="meal-card-top">
          <span class="who-chip${whoCls}">${esc(card.whoIcon || '')} ${esc(card.who)}</span>
          <span class="meal-title">${esc(card.title)}</span>
        </div>
        <ul class="meal-menu">
          ${(card.menu || []).map(m => `<li><span class="mi" aria-hidden="true">${esc(m.icon || '·')}</span><span>${esc(m.text)}</span></li>`).join('')}
        </ul>
        <div class="meal-foot">
          <span class="time-chip">⏱ ${esc(card.time || '')}</span>
          <button type="button" class="eaten-btn" data-eaten="${esc(card.id)}" aria-pressed="${isEaten}">
            <span class="dot" aria-hidden="true"></span><span class="eaten-label">먹음</span>
          </button>
        </div>
        ${card.tip ? `<p class="meal-tip">${esc(card.tip)}</p>` : ''}
      </article>`;
  }

  function mealSection() {
    const plan = state.data.todayPlan;
    if (!plan) return '';
    const label = plan.label || '';
    return `
      <div class="meal-head">
        <h2><span class="q-ico" aria-hidden="true">🔍</span>오늘 뭐 먹지?</h2>
        <span class="date-pill">내일 ${esc(label)} 식단</span>
      </div>
      ${plan.note ? `<p class="plan-note">${esc(plan.note)}</p>` : ''}
      ${(plan.meals || []).map(g => `
        <section class="meal-group" data-group="${esc(g.id)}">
          <div class="meal-group-head">
            <span class="mg-ico" aria-hidden="true">${esc(g.icon || '')}</span>${esc(g.label)}
            <span class="mg-count" data-group-count="${esc(g.id)}">${eatenCount(g.cards)}/${(g.cards || []).length} 먹음</span>
          </div>
          ${(g.cards || []).map(mealCard).join('')}
        </section>`).join('')}`;
  }

  function eatenCount(cards) {
    return (cards || []).filter(c => eaten[c.id]).length;
  }

  /* ---------- items ---------- */
  function itemCard(item) {
    const tags = (item.tags || []).map(t => {
      const cls = t === '임박' ? 'tag--soon' : 'tag--eat';
      return `<span class="tag ${cls}">${esc(t)}</span>`;
    }).join('');
    return `
      <article class="item">
        <span class="item-emoji" aria-hidden="true">${esc(item.emoji || '🥫')}</span>
        <div class="item-body">
          <div class="item-name">${esc(item.name)}</div>
          <div class="item-qty">${esc(item.qty || '재고 있음')}</div>
          ${tags ? `<div class="item-tags">${tags}</div>` : ''}
          ${item.note ? `<div class="item-note">${esc(item.note)}</div>` : ''}
        </div>
      </article>`;
  }

  function itemBlock(list, showCat) {
    if (!list.length) return '';
    if (!showCat) return `<div class="items">${list.map(itemCard).join('')}</div>`;
    return CAT_ORDER.map(cat => {
      const sub = list.filter(i => i.cat === cat.id);
      if (!sub.length) return '';
      return `<div class="cat-head">${esc(cat.label)} · ${sub.length}</div>
              <div class="items">${sub.map(itemCard).join('')}</div>`;
    }).join('');
  }

  function itemArea(tab) {
    const filtered = items().filter(matches);
    const locs = tab === 'all' ? ['cold', 'frozen', 'kimchi'] : [tab];

    if (!filtered.length) {
      return `<div class="empty"><span class="e-ico" aria-hidden="true">🥲</span>
        ${state.query ? `‘${esc(state.query)}’에 맞는 재료가 없어요.` : '이 분류에는 재료가 없어요.'}</div>`;
    }

    return locs.map(loc => {
      const list = filtered.filter(i => i.loc === loc);
      if (!list.length) return '';
      return `<section class="loc-group">
        <div class="loc-head"><span class="loc-ico" aria-hidden="true">${LOCS[loc].icon}</span>${esc(LOCS[loc].label)}
          <span class="loc-count">${list.length}개</span></div>
        ${itemBlock(list, true)}
      </section>`;
    }).join('');
  }

  /* ---------- week / simple / shop ---------- */
  function weekView() {
    const days = (state.data.weekPlan || []).map(d => `
      <article class="week-day${d.today ? ' is-today' : ''}">
        <div class="week-day-head">
          <span class="week-date">${esc((d.date || '').slice(5).replace('-', '/'))}<small>${esc(dayOf(d.date) || d.day || '')}요일</small></span>
          ${d.today ? '<span class="today-pill">오늘</span>' : ''}
        </div>
        <div class="week-meals">
          <div class="week-row"><span class="wm-label">아침</span><span class="wm-text">${esc(d.breakfast || '')}</span></div>
          <div class="week-row"><span class="wm-label">점심</span><span class="wm-text">${esc(d.lunch || '')}</span></div>
          <div class="week-row"><span class="wm-label">저녁</span><span class="wm-text">${esc(d.dinner || '')}</span></div>
        </div>
      </article>`).join('');

    return `<div class="panel-title"><h2>이번 주 식단</h2><span class="note">냉장고 재료 기준</span></div>
      <p class="plan-note">있는 재료를 먼저 쓰는 순서로 짰어요. 장보면 바뀔 수 있어요.</p>
      <div class="week-list">${days}</div>`;
  }

  function simpleView() {
    const cards = (state.data.simpleMeals || []).map(s => `
      <article class="simple-card">
        <span class="simple-emoji" aria-hidden="true">${esc(s.emoji || '🍽')}</span>
        <div class="simple-body">
          <div class="simple-top">
            <span class="simple-title">${esc(s.title)}</span>
            <span class="simple-time">${esc(s.time || '')}</span>
          </div>
          <p class="simple-desc">${esc(s.desc || '')}</p>
          ${s.tag ? `<div class="simple-tag"># ${esc(s.tag)}</div>` : ''}
        </div>
      </article>`).join('');

    return `<div class="panel-title"><h2>간단 식단</h2><span class="note">손이 적게 가는 것부터</span></div>
      <p class="plan-note">바빠서 요리할 힘 없을 때 이 목록만 봐도 돼요.</p>
      <div class="simple-grid">${cards}</div>`;
  }

  function shopView() {
    const list = state.data.shopping || [];
    const done = list.filter(s => checked[s.id]).length;
    const pct = list.length ? Math.round((done / list.length) * 100) : 0;

    return `<div class="panel-title"><h2>장보기</h2><span class="note">${done}/${list.length} 담음</span></div>
      <div class="shop-progress">
        <span class="sp-text"><b>${done}</b> / ${list.length}</span>
        <div class="bar"><span style="width:${pct}%"></span></div>
      </div>
      <div class="shop-list">
        ${list.map(s => `
          <button type="button" class="shop-item${checked[s.id] ? ' is-done' : ''}" data-shop="${esc(s.id)}" aria-pressed="${!!checked[s.id]}">
            <span class="shop-box" aria-hidden="true">✓</span>
            <span class="shop-body">
              <span class="shop-name">${esc(s.name)}<span class="shop-qty">${esc(s.qty || '')}</span></span>
              <span class="shop-reason">${esc(s.reason || '')}</span>
            </span>
          </button>`).join('')}
      </div>
      <p class="shop-note">담은 것은 이 기기에만 저장돼요.<br />장 보고 오면 누른 것만 다시 풀면 됩니다.</p>`;
  }

  /* ---------- main render ---------- */
  function renderView() {
    const tab = state.tab;

    if (tab === 'week') { view.innerHTML = weekView(); return; }
    if (tab === 'simple') { view.innerHTML = simpleView(); return; }
    if (tab === 'shop') { view.innerHTML = shopView(); return; }

    const withSearch = true;
    view.innerHTML = `
      ${withSearch ? searchBar() : ''}
      ${chipBar()}
      ${tab === 'all' ? mealSection() : ''}
      <div id="itemArea">${itemArea(tab)}</div>`;
  }

  function refreshItemArea() {
    const area = $('#itemArea');
    if (area) area.innerHTML = itemArea(state.tab === 'all' ? 'all' : state.tab);
  }

  function refreshEatenCounts() {
    const plan = state.data.todayPlan;
    if (!plan) return;
    (plan.meals || []).forEach(g => {
      const el = document.querySelector(`[data-group-count="${g.id}"]`);
      if (el) el.textContent = `${eatenCount(g.cards)}/${(g.cards || []).length} 먹음`;
    });
  }

  /* ---------- events ---------- */
  document.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.tab');
    if (tabBtn) {
      state.tab = tabBtn.dataset.tab;
      state.cat = 'all';
      renderTabs();
      renderView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const chip = e.target.closest('.chip');
    if (chip) {
      state.cat = chip.dataset.cat;
      document.querySelectorAll('.chip').forEach(c => c.classList.toggle('is-active', c === chip));
      refreshItemArea();
      return;
    }

    const clear = e.target.closest('[data-clear]');
    if (clear) {
      state.query = '';
      renderView();
      const input = $('#searchInput');
      if (input) input.focus();
      return;
    }

    const eatenBtn = e.target.closest('.eaten-btn');
    if (eatenBtn) {
      const id = eatenBtn.dataset.eaten;
      const card = eatenBtn.closest('.meal-card');
      if (eaten[id]) delete eaten[id];
      else eaten[id] = new Date().toISOString();
      save(EATEN_KEY, eaten);
      const isEaten = !!eaten[id];
      card.classList.toggle('is-eaten', isEaten);
      eatenBtn.setAttribute('aria-pressed', String(isEaten));
      refreshEatenCounts();
      return;
    }

    const shopBtn = e.target.closest('.shop-item');
    if (shopBtn) {
      const id = shopBtn.dataset.shop;
      checked[id] = !checked[id];
      if (!checked[id]) delete checked[id];
      save(SHOP_KEY, checked);
      shopBtn.classList.toggle('is-done', !!checked[id]);
      shopBtn.setAttribute('aria-pressed', String(!!checked[id]));
      renderView();
      return;
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'searchInput') {
      state.query = e.target.value;
      refreshItemArea();
      const clearBtn = document.querySelector('.search-clear');
      if (state.query && !clearBtn) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'search-clear';
        btn.dataset.clear = '1';
        btn.setAttribute('aria-label', '검색어 지우기');
        btn.textContent = '✕';
        document.querySelector('.search').appendChild(btn);
      } else if (!state.query && clearBtn) {
        clearBtn.remove();
      }
    }
  });

  /* ---------- boot ---------- */
  fetch('data.json', { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(data => {
      state.data = data;
      renderHeader();
      renderTabs();
      renderView();
    })
    .catch(err => {
      $('#updated').textContent = '불러오지 못했어요';
      view.innerHTML = `<div class="empty"><span class="e-ico" aria-hidden="true">🧊</span>
        냉장고 자료를 못 읽었어요.<br /><small>data.json을 확인해 주세요 (${esc(err.message)})</small></div>`;
    });
})();
