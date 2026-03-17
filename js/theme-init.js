(function () {
  var colors = {
    "Reforestation Initiative":  "#2d6a2d",
    "Ocean Cleanup Project":     "#1a6080",
    "Urban Solar Grid":          "#b07a10",
    "Coral Reef Restoration":    "#c0440a",
    "Food Waste Reduction":      "#7a5a1a",
    "Clean Water Access":        "#2060a0",
    "Rewilding Project":         "#4a7a2a",
    "Urban Green Spaces":        "#3a7a3a",
    "Shark Population Recovery": "#1a3a6a",
  };

  function hexToHsl(hex) {
    var r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
    var max = Math.max(r,g,b), min = Math.min(r,g,b), h = 0, s = 0;
    var l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100) };
  }

  function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    var a = s * Math.min(l, 1 - l);
    var f = function (n) {
      var k = (n + h / 30) % 12;
      return Math.round((l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))) * 255);
    };
    return [f(0), f(8), f(4)];
  }

  function applyPalette(hex, dark) {
    var hsl = hexToHsl(hex);
    var h = hsl.h, s = hsl.s;
    var root = document.documentElement;

    if (dark) {
      var accentS = Math.min(Math.round(s * 1.5), 65);
      var accentL = 62;
      var rgb = hslToRgb(h, accentS, accentL);
      var sat = Math.min(s, 18);
      root.style.setProperty("--color-primary",         "hsl(" + h + ", " + accentS + "%, " + accentL + "%)");
      root.style.setProperty("--color-primary-rgb",     rgb[0] + ", " + rgb[1] + ", " + rgb[2]);
      root.style.setProperty("--color-primary-bg",      "hsl(" + h + ", " + Math.min(s, 35) + "%, 14%)");
      root.style.setProperty("--color-bg",              "hsl(" + h + ", " + sat + "%, 10%)");
      root.style.setProperty("--color-surface",         "hsl(" + h + ", " + sat + "%, 15%)");
      root.style.setProperty("--color-text",            "hsl(" + h + ", " + Math.min(s, 12) + "%, 88%)");
      root.style.setProperty("--color-text-muted",      "hsl(" + h + ", " + Math.min(s, 12) + "%, 52%)");
      root.style.setProperty("--color-text-dim",        "hsl(" + h + ", " + Math.min(s, 12) + "%, 46%)");
      root.style.setProperty("--color-border",          "hsl(" + h + ", " + sat + "%, 22%)");
      root.style.setProperty("--color-input-border",    "hsl(" + h + ", " + Math.min(s, 20) + "%, 30%)");
      root.style.setProperty("--color-header-text",     "hsl(" + h + ", 12%, 88%)");
      root.style.setProperty("--color-header-hover-bg", "rgba(255, 255, 255, 0.08)");
    } else {
      var pr = parseInt(hex.slice(1,3),16), pg = parseInt(hex.slice(3,5),16), pb = parseInt(hex.slice(5,7),16);
      var bright = pr * 0.299 + pg * 0.587 + pb * 0.114;
      var sat = Math.min(s, 25);
      root.style.setProperty("--color-primary",         hex);
      root.style.setProperty("--color-primary-rgb",     pr + ", " + pg + ", " + pb);
      root.style.setProperty("--color-primary-bg",      hex);
      root.style.setProperty("--color-bg",              "hsl(" + h + ", " + sat + "%, 96%)");
      root.style.setProperty("--color-surface",         "#fff");
      root.style.setProperty("--color-text",            "hsl(" + h + ", " + Math.min(s, 30) + "%, 12%)");
      root.style.setProperty("--color-text-muted",      "hsl(" + h + ", " + sat + "%, 42%)");
      root.style.setProperty("--color-text-dim",        "hsl(" + h + ", " + sat + "%, 37%)");
      root.style.setProperty("--color-border",          "hsl(" + h + ", " + sat + "%, 88%)");
      root.style.setProperty("--color-input-border",    "hsl(" + h + ", " + Math.min(s, 35) + "%, 76%)");
      root.style.setProperty("--color-header-text",     bright > 120 ? "#111" : "#f4f8f4");
      root.style.setProperty("--color-header-hover-bg", bright > 120 ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.15)");
    }
  }

  function isDark() {
    var pref = localStorage.getItem("colorTheme");
    if (pref === "dark") return true;
    if (pref === "light") return false;
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function applyAll() {
    var dark = isDark();
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    var hex = colors[localStorage.getItem("activeProject")];
    if (hex) applyPalette(hex, dark);
  }

  // Suppress transitions during initial theme application to prevent FOUC
  document.documentElement.classList.add("theme-init");
  applyAll();

  document.addEventListener("DOMContentLoaded", function () {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.documentElement.classList.remove("theme-init");
        updateToggleIcon();
      });
    });
  });

  window.applyAll = applyAll;

  window.toggleTheme = function () {
    localStorage.setItem("colorTheme", isDark() ? "light" : "dark");
    applyAll();
    updateToggleIcon();
  };

  function updateToggleIcon() {
    var btn = document.getElementById("theme-toggle-btn");
    if (!btn) return;
    var dark = isDark();
    btn.textContent = dark ? "\u2600\ufe0e" : "\u263d";
    btn.title = dark ? "Switch to light mode" : "Switch to dark mode";
  }

  window.updateToggleIcon = updateToggleIcon;

  // updateToggleIcon is called by the DOMContentLoaded handler above

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      if (!localStorage.getItem("colorTheme")) { applyAll(); updateToggleIcon(); }
    });
  }
})();
