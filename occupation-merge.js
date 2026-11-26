/* Occupation merge: special careers (packs + mod careers) show up directly inside the Occupation screen,
 * so there is no "Special Careers" middle step. It builds the old Special Careers list off-screen
 * (through the whole mod chain), moves its rows into Occupation, and sends every "back to Special Careers"
 * to Occupation. Remove this script from game.html to get the old behaviour back. */
(function () {
  if (window.__occMerge) return;
  window.__occMerge = true;
  const origOcc = window.openOccupation;
  if (typeof origOcc !== "function") return;
  let building = false;
  let chain = null;

  function install() {
    if (chain) return;
    chain = window.openSpecialCareers;
    if (typeof chain !== "function") { chain = null; return; }
    const redirect = function () {
      if (building) return chain.apply(this, arguments);
      return window.openOccupation();
    };
    window.openSpecialCareers = redirect;
    try { openSpecialCareers = redirect; } catch (e) {}
  }

  function addSpecial() {
    if (typeof sList === "undefined") return;
    const spRow = sList.querySelector('[data-go="special"]');
    if (!spRow) return;
    install();
    if (!chain) return;
    const saved = { t: sTitle.textContent, s: sSub.style.display, b: sBack.innerHTML, c: sBack.onclick };
    const occ = Array.from(sList.childNodes);
    let sp = [];
    building = true;
    try {
      chain();
      sp = Array.from(sList.childNodes);
    } finally {
      building = false;
      sTitle.textContent = saved.t;
      sSub.style.display = saved.s;
      sBack.innerHTML = saved.b;
      sBack.onclick = saved.c;
    }
    const sec = sp.find((n) => n.classList && n.classList.contains("sec"));
    if (sec) sec.textContent = "Special Careers";
    const frag = document.createDocumentFragment();
    occ.forEach((n) => {
      if (n === spRow) { sp.forEach((x) => frag.appendChild(x)); n.style.display = "none"; }
      frag.appendChild(n);
    });
    sList.innerHTML = "";
    sList.appendChild(frag);
    sList.scrollTop = 0;
  }

  const merged = function () {
    const r = origOcc.apply(this, arguments);
    try { addSpecial(); } catch (e) { console.warn("[occupation-merge]", e); }
    return r;
  };
  window.openOccupation = merged;
  try { openOccupation = merged; } catch (e) {}
})();
