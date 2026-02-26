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
  var hex = colors[localStorage.getItem("activeProject")];
  if (!hex) return;
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
  h = Math.round(h * 360); s = Math.round(s * 100);
  var sat = Math.min(s, 25);
  var pr = parseInt(hex.slice(1,3),16), pg = parseInt(hex.slice(3,5),16), pb = parseInt(hex.slice(5,7),16);
  var bright = pr * 0.299 + pg * 0.587 + pb * 0.114;
  var headerText = bright > 120 ? "#111" : "#f4f8f4";
  var headerHoverBg = bright > 120 ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.15)";
  var root = document.documentElement;
  root.style.setProperty("--color-primary",       hex);
  root.style.setProperty("--color-primary-rgb",   pr + ", " + pg + ", " + pb);
  root.style.setProperty("--color-bg",            "hsl(" + h + ", " + sat + "%, 96%)");
  root.style.setProperty("--color-text",          "hsl(" + h + ", " + Math.min(s,30) + "%, 12%)");
  root.style.setProperty("--color-text-muted",    "hsl(" + h + ", " + sat + "%, 42%)");
  root.style.setProperty("--color-text-dim",      "hsl(" + h + ", " + sat + "%, 37%)");
  root.style.setProperty("--color-border",        "hsl(" + h + ", " + sat + "%, 88%)");
  root.style.setProperty("--color-input-border",  "hsl(" + h + ", " + Math.min(s,35) + "%, 76%)");
  root.style.setProperty("--color-header-text",   headerText);
  root.style.setProperty("--color-header-hover-bg", headerHoverBg);
})();
