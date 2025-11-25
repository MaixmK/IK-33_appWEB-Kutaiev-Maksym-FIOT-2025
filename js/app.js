// Бургер-меню
const burger = document.querySelector('.burger');
const nav = document.getElementById('nav');

burger?.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') === 'true';
  burger.setAttribute('aria-expanded', String(!open));
  nav.dataset.open = String(!open);
});

// Пошук — перенаправлення в каталог із параметром
document.querySelector('.search')?.addEventListener('submit', e => {
  e.preventDefault();
  const q = e.currentTarget.querySelector('input').value.trim();
  const url = q ? `/catalog?search=${encodeURIComponent(q)}` : '/catalog';
  window.location.href = url;
});
