document.addEventListener('DOMContentLoaded', () => {
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('nav');

  if (!burger || !nav) return;

  burger.addEventListener('click', () => {
    const isOpen = nav.getAttribute('data-open') === 'true';
    nav.setAttribute('data-open', String(!isOpen));
    burger.setAttribute('aria-expanded', String(!isOpen));
  });

  function autoToggleMenu() {
    if (window.innerWidth <= 768) {
      nav.setAttribute('data-open', 'true');
      burger.setAttribute('aria-expanded', 'true');
    } else {
      nav.setAttribute('data-open', 'false');
      burger.setAttribute('aria-expanded', 'false');
    }
  }

  autoToggleMenu();

  window.addEventListener('resize', autoToggleMenu);
});

  const map = {
    cpu:'cpu.html', mb:'mb.html', ram:'ram.html', gpu:'gpu.html',
    storage:'storage.html', case:'case.html', psu:'psu.html', cooling:'cooling.html'
  };
  document.querySelectorAll('.catalog .card__link').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const href = a.getAttribute('href')||'';
      let cat = null; try { cat = new URL(href, location.href).searchParams.get('category'); } catch(e){}
      if (cat && map[cat]) { e.preventDefault(); location.href = map[cat]; }
    });
  });

  (function(){
    const KEY = 'pc_cart';
    function count(){
      try {
        const c = JSON.parse(localStorage.getItem(KEY)) || {items:[]};
        return c.items.reduce((s,i)=>s+i.qty,0);
      } catch(e){ return 0; }
    }
    function update(){ var el = document.getElementById('cartCount'); if(el) el.textContent = String(count()); }
    window.addEventListener('storage', update);
    document.addEventListener('DOMContentLoaded', update);
  })();