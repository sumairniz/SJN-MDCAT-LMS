"use strict";
/* Public, non-sensitive appearance setting only. This module does not authenticate,
   transmit data, read cookies or make network requests. */
(function () {
  const KEY = "sjn-mednest-management-appearance-v1";
  const VALID = ["system", "dark", "light"];
  const media = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  let preference = "system";
  try {
    const stored = window.localStorage.getItem(KEY);
    if (VALID.includes(stored)) preference = stored;
  } catch (_) { /* Storage may be unavailable; continue with the device preference. */ }

  function effectiveMode() {
    return preference === "system" ? (media ? (media.matches ? "dark" : "light") : "dark") : preference;
  }
  function render() {
    const active = effectiveMode();
    document.documentElement.setAttribute("data-theme", active);
    document.documentElement.setAttribute("data-appearance", preference);
    const color = active === "light" ? "#f5f7fb" : "#0d1018";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", color);
    document.querySelectorAll("[data-theme-choice]").forEach(function (button) {
      const selected = button.getAttribute("data-theme-choice") === preference;
      button.setAttribute("aria-pressed", String(selected));
      button.classList.toggle("is-selected", selected);
    });
  }
  function setPreference(next) {
    if (!VALID.includes(next)) return;
    preference = next;
    try { window.localStorage.setItem(KEY, next); } catch (_) { /* Still works in this tab. */ }
    render();
  }
  render();
  if (media) {
    if (typeof media.addEventListener === "function") media.addEventListener("change", render);
    else if (typeof media.addListener === "function") media.addListener(render);
  }
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-theme-choice]").forEach(function (button) {
      button.addEventListener("click", function () {
        setPreference(button.getAttribute("data-theme-choice"));
      });
    });
    render();
  });
}());
