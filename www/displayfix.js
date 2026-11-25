(function () {
  // Change this to taste: 1 = no change, 0.85 = 15% smaller, 0.75 = 25% smaller, etc.
  var SCALE = 0.85;

  function boot() {
    if (!document.body) {
      setTimeout(boot, 50);
      return;
    }
    init();
  }

  function init() {
    addScaleStyle();
    addTopSafeBar();
  }

  function addScaleStyle() {
    if (document.getElementById("uiScaleStyle")) return; // already injected

    var style = document.createElement("style");
    style.id = "uiScaleStyle";
    // "zoom" (Chromium/Android WebView) shrinks the rendered size, but it
    // also shrinks anything sized in viewport units (like .phone's
    // height: 100vh), so without compensating, the phone frame ends up
    // smaller than the real screen and leaves blank space / a wrong
    // aspect ratio. The fix (same trick this game already uses for its
    // own PC/desktop zoom mode): pre-inflate the height by 1 / scale so
    // that after the zoom shrink it lands back on exactly 100% of the
    // real screen height.
    style.textContent =
      ":root { --ui-scale: " +
      SCALE +
      "; }" +
      ".phone {" +
      "zoom: var(--ui-scale) !important;" +
      "height: calc(100vh / var(--ui-scale)) !important;" +
      "}";
    document.head.appendChild(style);
  }

  // Menus (#screen, reused for Activities/Occupation/Market/etc.) and the
  // Family Tree (#ftWrap) slide open/closed with a CSS transform. Putting
  // the safe-area bar *inside* them meant it rode along with that slide,
  // which looked like the bar detaching and sliding across the screen
  // mid-animation. Instead, put ONE bar directly on the real viewport
  // (fixed position, outside .phone entirely, above everything via a very
  // high z-index) so it never moves no matter what's animating under it,
  // and isn't affected by the .phone zoom/scale above either.
  function addTopSafeBar() {
    if (document.getElementById("topSafeBar")) return; // already injected

    var style = document.createElement("style");
    style.id = "topSafeStyle";
    style.textContent =
      "#topSafeBar {" +
      "position: fixed;" +
      "top: 0;" +
      "left: 0;" +
      "right: 0;" +
      "height: env(safe-area-inset-top, 0px);" +
      "background: #000;" +
      "z-index: 2147483647;" +
      "pointer-events: none;" +
      "}" +
      "html.pc #topSafeBar {" +
      "display: none;" +
      "}";
    document.head.appendChild(style);

    var bar = document.createElement("div");
    bar.id = "topSafeBar";
    document.body.appendChild(bar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
