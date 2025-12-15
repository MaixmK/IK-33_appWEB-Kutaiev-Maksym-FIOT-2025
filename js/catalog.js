(function(){
  const $ = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const fmtPrice = v => new Intl.NumberFormat('uk-UA', { style:'currency', currency:'UAH' }).format(v);

  const CATNAMES = {
    cpu:'Процесори',
    gpu:'Відеокарти',
    ram:'Оперативна памʼять',
    mb:'Материнські плати',
    storage:'Накопичувачі',
    psu:'Блоки живлення',
    case:'Корпуси',
    cooling:'Охолодження'
  };
  const CART_KEY = 'pc_cart';

  // --- ПАГІНАЦІЯ ---
  const PER_PAGE = 6;      // скільки товарів показувати на сторінці
  let currentPage = 1;     // поточна сторінка

  // ===== CART =====
  function loadCart(){
    try { 
      return JSON.parse(localStorage.getItem(CART_KEY)) || {items:[], updatedAt: Date.now()}; 
    }
    catch(e){ 
      return {items:[], updatedAt: Date.now()}; 
    }
  }
  function saveCart(state){
    state.updatedAt = Date.now();
    localStorage.setItem(CART_KEY, JSON.stringify(state));
    updateCartCount();
  }
  function addToCart(prod, qty=1){
    const cart = loadCart();
    const idx = cart.items.findIndex(i => i.id === prod.id);
    if(idx >= 0){
      cart.items[idx].qty += qty;
    } else {
      cart.items.push({
        id: prod.id, title: prod.title, price: prod.price, img: prod.img, qty: qty
      });
    }
    saveCart(cart);
    toast(`Додано в кошик: ${prod.title}`);
  }
  function getCartCount(){
    const cart = loadCart();
    return cart.items.reduce((acc, i) => acc + i.qty, 0);
  }
  function updateCartCount(){
    const el = document.getElementById('cartCount');
    if(el) el.textContent = String(getCartCount());
  }

  // ===== UI: toast =====
  let toastTimer = null;
  function ensureToastEl(){
    let t = $('#toast');
    if(!t){
      t = document.createElement('div');
      t.id = 'toast';
      Object.assign(t.style, {
        position: 'fixed', right: '16px', bottom: '16px',
        background: '#111', color: '#fff', padding: '10px 14px',
        borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,.25)',
        opacity: '0', transform: 'translateY(8px)', transition: '.25s all ease', zIndex: '9999'
      });
      document.body.appendChild(t);
    }
    return t;
  }
  function toast(msg){
    const t = ensureToastEl();
    t.textContent = msg;
    requestAnimationFrame(()=>{
      t.style.opacity = '1';
      t.style.transform = 'translateY(0)';
    });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>{
      t.style.opacity = '0';
      t.style.transform = 'translateY(8px)';
    }, 1800);
  }

  // ===== Catalog core =====
  function getCatName(id){ 
    return CATNAMES[id] || 'Каталог'; 
  }

  function applyFilters(list){
    const q = ($('#q')?.value||'').trim().toLowerCase();
    const sort = $('#sort')?.value;
    let items = list.slice();

    if(q) {
      items = items.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.desc.toLowerCase().includes(q) ||
        Object.values(p.specs||{}).some(v => String(v).toLowerCase().includes(q))
      );
    }

    if (sort === 'price_asc') items.sort((a,b)=>a.price-b.price);
    else if (sort === 'price_desc') items.sort((a,b)=>b.price-a.price);
    else if (sort === 'rating_desc') items.sort((a,b)=>b.rating-a.rating);
    else items.sort((a,b)=>b.rating - a.rating || a.price - b.price);

    return items;
  }

  function renderGrid(list){
    const el = $('#grid');
    if (!el) return;

    el.innerHTML = '';
    if(!list.length) {
      el.innerHTML = '<div class="empty">Нічого не знайдено.</div>'; 
      return; 
    }

    list.forEach(p=>{
      const card = document.createElement('article');
      card.className='card';
      card.innerHTML = `
        <div class="thumb"><img src="${p.img}" alt="${p.title}"></div>
        <div class="pad">
          <div class="badge">${getCatName(p.category)}</div>
          <h3 style="margin:8px 0 4px; font-size:18px">${p.title}</h3>
          <div class="muted" style="min-height: 40px">${p.desc}</div>
          <div class="row-between" style="margin-top:10px">
            <div>
              <span class="price">${fmtPrice(p.price)}</span>
              <span class="rating">★ ${p.rating.toFixed(1)}</span>
            </div>
            <div class="row" style="gap:8px">
              <button class="btn ghost" data-id="${p.id}" data-action="details" aria-label="Детальніше про ${p.title}">Детальніше</button>
              <button class="btn" data-id="${p.id}" data-action="add" aria-label="Додати ${p.title} до кошика">🛒</button>
            </div>
          </div>
        </div>`;
      el.appendChild(card);
    });

    el.onclick = (e)=>{
      const btn = e.target.closest('button[data-action]');
      if(!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const product = (window.PRODUCTS||[]).find(x=>x.id===id);
      if(!product) return;

      if(action === 'details') openModal(id);
      if(action === 'add') addToCart(product, 1);
    };
  }

  // --- рендер кнопок пагінації ---
  function renderPagination(totalItems) {
    const container = $('#pagination');
    if (!container) return;

    const totalPages = Math.max(1, Math.ceil(totalItems / PER_PAGE));

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '';

    html += `<button class="page-btn" data-page="prev" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;

    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    html += `<button class="page-btn" data-page="next" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;

    container.innerHTML = html;
  }

  function openModal(id){
    const p = (window.PRODUCTS||[]).find(x=>x.id===id);
    if(!p) return;
    $('#m-img').src = p.img;
    $('#m-title').textContent = p.title;
    $('#m-sku').textContent = `SKU: ${p.sku}`;
    $('#m-desc').textContent = p.desc;
    $('#m-category').textContent = getCatName(p.category);
    $('#m-price').textContent = new Intl.NumberFormat('uk-UA', { style:'currency', currency:'UAH' }).format(p.price);
  const buyBtn = $('#btn-buy');
  buyBtn.onclick = () => {
  // додати в кошик (використай свою addToCart)
  buyBtn.onclick = () => {
  addToCart({
    id: p.id,
    title: p.title,
    price: p.price,
    img: p.img
  }, 1);

  window.location.href = '../cart.html';
};

  // опційно: одразу перейти в кошик
  window.location.href = '../cart.html';
};
    const specs = $('#m-specs'); 
    specs.innerHTML = '';
    Object.entries(p.specs||{}).forEach(([k,v])=>{
      const d = document.createElement('div');
      d.innerHTML = `<div class="muted" style="font-size:12px">${k}</div><div style="font-weight:600">${v}</div>`;
      specs.appendChild(d);
    });
    $('#modal').showModal();
  }

  function filterByFixedCategory(){
    const FIXED = window.FIXED_CATEGORY || null;
    const all = (window.PRODUCTS||[]);
    return FIXED ? all.filter(p=>p.category===FIXED) : all;
  }

  // --- ГОЛОВНИЙ РЕНДЕР З УРАХУВАННЯМ ПАГІНАЦІЇ ---
  function render(){
    const list = filterByFixedCategory();
    const filtered = applyFilters(list);

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PER_PAGE;
    const pageItems = filtered.slice(start, start + PER_PAGE);

    renderGrid(pageItems);
    renderPagination(totalItems);
  }

  function initCatalog(){
    const FIXED = window.FIXED_CATEGORY || null;
    const title = window.CATALOG_TITLE || (FIXED ? getCatName(FIXED) : 'Каталог');
    $('#title').textContent = title;
    $('#crumb').textContent = title === 'Каталог' ? '' : '· ' + title;

    $('#q').addEventListener('input', () => {
      currentPage = 1;   // при новому пошуку переходити на 1 сторінку
      render();
    });
    $('#sort').addEventListener('change', () => {
      currentPage = 1;
      render();
    });

    $('#btn-close').addEventListener('click', ()=> $('#modal').close());
    $('#modal').addEventListener('click', (e)=>{ 
      if(e.target.tagName==='DIALOG') e.target.close(); 
    });

    const pagination = $('#pagination');
    if (pagination) {
      pagination.addEventListener('click', (e) => {
        const btn = e.target.closest('.page-btn');
        if (!btn) return;

        const page = btn.dataset.page;

        const list = filterByFixedCategory();
        const filtered = applyFilters(list);
        const totalItems = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / PER_PAGE));

        if (page === 'prev' && currentPage > 1) {
          currentPage--;
        } else if (page === 'next' && currentPage < totalPages) {
          currentPage++;
        } else {
          const n = Number(page);
          if (!Number.isNaN(n)) currentPage = n;
        }

        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    updateCartCount();
    render();
  }

  window.initCatalog = initCatalog;
})();
