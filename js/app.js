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


  // === ВІДКРИТИ / ЗАКРИТИ МОДАЛЬНЕ ВІКНО ===
  const modal = document.getElementById("calculator-modal");
  const icon = document.getElementById("calculator-icon");
  const closeBtn = document.getElementById("calc-close");
  if (!modal || !icon || !closeBtn) return;

  
  icon.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Закриття при кліку поза вікном
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });


  // === ЛОГІКА КАЛЬКУЛЯТОРА ===  
  const display = document.getElementById("display");
  if (!display) return;

  let firstOperand = null;
  let operator = null;
  let waitingForSecondOperand = false;

  function inputDigit(digit) {
    if (waitingForSecondOperand) {
      display.value = digit;
      waitingForSecondOperand = false;
    } else {
      display.value = display.value === "0" ? digit : display.value + digit;
    }
  }

  function inputDot() {
    if (waitingForSecondOperand) {
      display.value = "0.";
      waitingForSecondOperand = false;
      return;
    }
    if (!display.value.includes(".")) {
      display.value += ".";
    }
  }

  function handleOperator(nextOperator) {
    const inputValue = parseFloat(display.value);

    if (operator && waitingForSecondOperand) {
      operator = nextOperator;
      return;
    }

    if (firstOperand === null && !Number.isNaN(inputValue)) {
      firstOperand = inputValue;
    } else if (operator) {
      const result = calculate(firstOperand, inputValue, operator);
      display.value = String(result);
      firstOperand = result;
    }

    operator = nextOperator;
    waitingForSecondOperand = true;
  }

  function calculate(a, b, op) {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b === 0 ? "Error" : a / b;
      case "%": return a % b;
      case "^": return Math.pow(a, b);
      default: return b;
    }
  }

  function clearAll() {
    display.value = "";
    firstOperand = null;
    operator = null;
    waitingForSecondOperand = false;
  }

  function backspace() {
    display.value = display.value.slice(0, -1);
  }

  // Обробка цифр
  document.querySelectorAll("button[data-num]").forEach(btn => {
    btn.addEventListener("click", () => {
      const value = btn.getAttribute("data-num");
      if (value === ".") inputDot();
      else inputDigit(value);
    });
  });

  // Обробка операторів
  document.querySelectorAll("button.operator[data-op]").forEach(btn => {
    btn.addEventListener("click", () => {
      handleOperator(btn.getAttribute("data-op"));
    });
  });

  // √
  document.getElementById("sqrt").addEventListener("click", () => {
    const value = parseFloat(display.value);
    if (Number.isNaN(value)) return;

    if (value < 0) {
      display.value = "Error";
      return;
    }

    const result = Math.sqrt(value);
    display.value = String(result);

    firstOperand = result;
    operator = null;
    waitingForSecondOperand = false;
  });

  // xʸ
  document.getElementById("pow").addEventListener("click", () => {
    const inputValue = parseFloat(display.value);
    if (Number.isNaN(inputValue)) return;

    if (firstOperand === null) firstOperand = inputValue;
    else if (operator) {
      const result = calculate(firstOperand, inputValue, operator);
      display.value = String(result);
      firstOperand = result;
    }

    operator = "^";
    waitingForSecondOperand = true;
  });

  // =
  document.getElementById("equal").addEventListener("click", () => {
    const inputValue = parseFloat(display.value);

    if (operator === null || waitingForSecondOperand) return;

    const result = calculate(firstOperand, inputValue, operator);
    display.value = String(result);
    firstOperand = null;
    operator = null;
    waitingForSecondOperand = false;
  });

  document.getElementById("clear").addEventListener("click", clearAll);

  document.getElementById("backspace").addEventListener("click", backspace);