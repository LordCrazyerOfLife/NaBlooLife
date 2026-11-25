(function () {
  // The actual scaling (the --ui-scale CSS var + the .phone.ui-scaled rule) now lives
  // permanently in game.html itself. This script's only job, when the Display Fix mod
  // is turned on in the Mod Loader, is to switch that scaling on by adding the class.
  // Turning the mod off again (Mod Loader) takes effect the next time NaBlooLife loads,
  // same as every other script mod.
  function boot() {
    var phone = document.querySelector(".phone");
    if (!phone) {
      setTimeout(boot, 50);
      return;
    }
    phone.classList.add("ui-scaled");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
