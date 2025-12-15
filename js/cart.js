(() => {
  const CART_KEY = "pc_cart";
  const $ = (s, r = document) => r.querySelector(s);
  const fmtPrice = (v) =>
    new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH" }).format(v);

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || { items: [], updatedAt: Date.now() };
    } catch {
      return { items: [], updatedAt: Date.now() };
    }
  }

  function saveCart(cart) {
    cart.updatedAt = Date.now();
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  }

  function updateCartCount() {
    const el = $("#cartCount");
    if (!el) return;
    const cart = loadCart();
    const totalQty = cart.items.reduce((s, it) => s + (it.qty || 0), 0);
    el.textContent = String(totalQty);
  }

  function clampQty(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.min(999, Math.floor(n)));
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function calcSummary(items) {
    const sumItems = items.length;
    const sumQty = items.reduce((s, it) => s + (it.qty || 0), 0);
    const sumTotal = items.reduce((s, it) => s + (it.price || 0) * (it.qty || 0), 0);
    return { sumItems, sumQty, sumTotal };
  }

  function renderCart() {
    const body = $("#cartBody");
    const empty = $("#cartEmpty");
    const table = $("#cartTable");
    const btnCheckout = $("#btnCheckout");

    // Якщо ми НЕ на сторінці кошика — просто оновимо лічильник і вийдемо
    if (!body || !empty || !table || !btnCheckout) {
      updateCartCount();
      return;
    }

    const cart = loadCart();
    const items = Array.isArray(cart.items) ? cart.items : [];

    body.innerHTML = "";

    if (items.length === 0) {
      empty.hidden = false;
      table.hidden = true;
      btnCheckout.disabled = true;
    } else {
      empty.hidden = true;
      table.hidden = false;
      btnCheckout.disabled = false;

      for (const it of items) {
        const qty = clampQty(it.qty || 1);
        const price = Number(it.price || 0);
        const lineTotal = price * qty;

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>
            <div class="cart-item">
              <img src="${it.img || ""}" alt="${escapeHtml(it.title || "Товар")}" />
              <div>
                <div class="title">${escapeHtml(it.title || "Товар")}</div>
                ${it.id ? `<div class="muted">ID: ${escapeHtml(it.id)}</div>` : ""}
              </div>
            </div>
          </td>

          <td class="right">${fmtPrice(price)}</td>

          <td class="center">
            <div class="qty" data-id="${escapeHtml(it.id || "")}">
              <button type="button" data-action="dec" aria-label="Зменшити">−</button>
              <input type="number" min="1" max="999" value="${qty}" aria-label="Кількість" />
              <button type="button" data-action="inc" aria-label="Збільшити">+</button>
            </div>
          </td>

          <td class="right"><strong>${fmtPrice(lineTotal)}</strong></td>

          <td class="center">
            <button class="btn" type="button" data-action="remove" data-id="${escapeHtml(it.id || "")}">✕</button>
          </td>
        `;

        body.appendChild(tr);
      }
    }

    // Підсумки
    const s = calcSummary(items);
    $("#sumItems").textContent = String(s.sumItems);
    $("#sumQty").textContent = String(s.sumQty);
    $("#sumTotal").textContent = fmtPrice(s.sumTotal);

    updateCartCount();
  }

  function changeQty(id, delta) {
    const cart = loadCart();
    const idx = cart.items.findIndex((it) => it.id === id);
    if (idx < 0) return;

    cart.items[idx].qty = clampQty((cart.items[idx].qty || 1) + delta);
    saveCart(cart);
    renderCart();
  }

  function setQty(id, qty) {
    const cart = loadCart();
    const idx = cart.items.findIndex((it) => it.id === id);
    if (idx < 0) return;

    cart.items[idx].qty = clampQty(qty);
    saveCart(cart);
    renderCart();
  }

  function removeItem(id) {
    const cart = loadCart();
    cart.items = cart.items.filter((it) => it.id !== id);
    saveCart(cart);
    renderCart();
  }

  function clearCart() {
    saveCart({ items: [] });
    renderCart();
  }

  function bindCartEvents() {
    // Якщо на цій сторінці немає кошика — нічого не підвʼязуємо
    const body = $("#cartBody");
    if (!body) return;

    // Делегування для +/− та remove
    body.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;

      if (action === "remove") {
        const id = btn.dataset.id;
        if (id) removeItem(id);
        return;
      }

      const wrap = btn.closest(".qty");
      const id = wrap?.dataset.id;
      if (!id) return;

      if (action === "inc") changeQty(id, +1);
      if (action === "dec") changeQty(id, -1);
    });

    // Ручне введення кількості
    body.addEventListener("change", (e) => {
      const input = e.target;
      if (!(input instanceof HTMLInputElement) || input.type !== "number") return;

      const wrap = input.closest(".qty");
      const id = wrap?.dataset.id;
      if (!id) return;

      setQty(id, input.value);
    });

    // Очистити кошик
    $("#btnClearCart")?.addEventListener("click", clearCart);

    // Оформити (демо)
    $("#btnCheckout")?.addEventListener("click", () => {
      const cart = loadCart();
      if (!cart.items.length) return;

      alert("Дякуємо! (демо) Замовлення сформовано.");
      clearCart();
    });

    // Синхронізація між вкладками
    window.addEventListener("storage", (e) => {
      if (e.key === CART_KEY) renderCart();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();

    bindCartEvents();
    renderCart();
  });

  window.__cart = {
    loadCart,
    saveCart,
    updateCartCount
  };
})();