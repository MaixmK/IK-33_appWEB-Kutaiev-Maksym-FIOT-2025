(() => {
  "use strict";

  // === Storage keys ===
  const USERS_KEY = "pc_users";
  const SESSION_KEY = "pc_session";

  const $ = (s, r = document) => r.querySelector(s);

  // === Helpers ===
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function loadUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function setSession(user) {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        email: user.email,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        loggedInAt: Date.now(),
      })
    );
  }

  // Легкий "хеш" (для лабораторної достатньо, але це не реальна безпека)
  function hashPassword(p) {
    let h = 0;
    for (let i = 0; i < p.length; i++) h = (h * 31 + p.charCodeAt(i)) | 0;
    return "h" + (h >>> 0).toString(16);
  }

  // === UI: errors ===
  function ensureErrorEl(input) {
    const id = input.id ? `${input.id}-err` : "";
    let err = id ? document.getElementById(id) : null;

    if (!err) {
      err = document.createElement("div");
      if (id) err.id = id;
      err.className = "field-error";
      err.style.marginTop = "6px";
      err.style.fontSize = "12px";
      err.style.color = "crimson";

      input.insertAdjacentElement("afterend", err);
    }
    return err;
  }

  function setFieldError(input, message) {
    const err = ensureErrorEl(input);
    err.textContent = message || "";
    input.classList.toggle("is-invalid", Boolean(message));
  }

  function clearFieldError(input) {
    setFieldError(input, "");
  }

  function setFormMessage(form, message) {
    let box = form.querySelector(".form-message");
    if (!box) {
      box = document.createElement("div");
      box.className = "form-message";
      box.style.marginTop = "12px";
      box.style.padding = "10px 12px";
      box.style.borderRadius = "10px";
      box.style.background = "rgba(220,20,60,.08)";
      box.style.color = "crimson";
      form.appendChild(box);
    }
    box.textContent = message || "";
    box.style.display = message ? "block" : "none";
  }

  // === Validators ===
  function validateEmail(input) {
    const v = input.value.trim();
    if (!v) return "Email є обов’язковим.";
    if (!emailRegex.test(v)) return "Некоректний формат email.";
    return "";
  }

  function validatePassword(input) {
    const v = input.value;
    if (!v) return "Пароль є обов’язковим.";
    if (v.length < 6) return "Пароль має містити щонайменше 6 символів.";
    return "";
  }

  function validateRequiredText(input, labelName) {
    const v = input.value.trim();
    if (!v) return `${labelName} є обов’язковим(ою).`;
    return "";
  }

  // === Page detection ===
  const isLogin = document.body.classList.contains("auth--login");
  const isRegister = document.body.classList.contains("auth--register");

  // ==========================================================
  // LOGIN
  // ==========================================================
  function initLogin() {
    const form = $("form.stack");
    if (!form) return;

    const email = $("#lemail");
    const pass = $("#lpass");

    if (!email || !pass) return;

    // Live validation
    email.addEventListener("input", () => setFieldError(email, validateEmail(email)));
    pass.addEventListener("input", () => setFieldError(pass, validatePassword(pass)));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      setFormMessage(form, "");

      const eErr = validateEmail(email);
      const pErr = validatePassword(pass);

      setFieldError(email, eErr);
      setFieldError(pass, pErr);

      if (eErr || pErr) return;

      const users = loadUsers();
      const user = users.find((u) => u.email === email.value.trim().toLowerCase());

      // "Серверна" помилка (імітація)
      if (!user) {
        setFormMessage(form, "Користувача з таким email не знайдено.");
        return;
      }

      if (user.passHash !== hashPassword(pass.value)) {
        setFormMessage(form, "Невірний пароль. Спробуйте ще раз.");
        return;
      }

      setSession(user);

      // Успіх
      window.location.href = "../index.html";
    });
  }

  // ==========================================================
  // REGISTER
  // ==========================================================
  function initRegister() {
    const form = $("form.stack");
    if (!form) return;

    const first = $("#first");
    const last = $("#last");
    const email = $("#email");
    const pass = $("#pass");

    if (!first || !last || !email || !pass) return;

    // Live validation
    first.addEventListener("input", () => setFieldError(first, validateRequiredText(first, "Ім’я")));
    last.addEventListener("input", () => setFieldError(last, validateRequiredText(last, "Прізвище")));
    email.addEventListener("input", () => setFieldError(email, validateEmail(email)));
    pass.addEventListener("input", () => setFieldError(pass, validatePassword(pass)));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      setFormMessage(form, "");

      const fErr = validateRequiredText(first, "Ім’я");
      const lErr = validateRequiredText(last, "Прізвище");
      const eErr = validateEmail(email);
      const pErr = validatePassword(pass);

      setFieldError(first, fErr);
      setFieldError(last, lErr);
      setFieldError(email, eErr);
      setFieldError(pass, pErr);

      if (fErr || lErr || eErr || pErr) return;

      const users = loadUsers();
      const emailVal = email.value.trim().toLowerCase();

      // "Серверна" помилка (імітація)
      if (users.some((u) => u.email === emailVal)) {
        setFormMessage(form, "Цей email вже зайнятий. Спробуйте інший.");
        return;
      }

      const newUser = {
        id: "u-" + Date.now(),
        first_name: first.value.trim(),
        last_name: last.value.trim(),
        email: emailVal,
        passHash: hashPassword(pass.value),
        createdAt: Date.now(),
      };

      users.push(newUser);
      saveUsers(users);

      // після реєстрації — одразу логінимо
      setSession(newUser);
      window.location.href = "../index.html";
    });
  }

  // Run
  document.addEventListener("DOMContentLoaded", () => {
    if (isLogin) initLogin();
    if (isRegister) initRegister();
  });
})();
