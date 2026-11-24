/* [mod] Event Juice: animaciones y sonidos para las tarjetas de eventos.
 *
 * No toca game.html: envuelve jCard (el popup de eventos/resultados) y le añade
 * entrada animada, sonido, brillo verde/rojo y un shake suave cuando el evento
 * es malo (lesión, multa, pérdida, etc.). Respeta "reduce motion" y el ajuste
 * de sonido del juego.
 */
(() => {
  "use strict";

  if (window.FL_EVENT_JUICE_LOADING) return;
  window.FL_EVENT_JUICE_LOADING = true;

  const GOOD =
    /(win|won|goal|scor|promot|sign|sold|sell|champion|trophy|record|great|success|improve|unlocked|famous|raise|bonus|contract|victoria|gan|gol|fich|campe|mejor|subid|contrato|bono|éxito|exito|premio)/i;
  const BAD =
    /(injur|suspend|ban\b|fine|fired|lost|lose|fail|arrest|prison|damage|crash|miss|reject|broke|debt|hospital|death|killed|attack|robbed|scam|diagnos|penalt|lesion|lesión|suspens|multa|perd|cárcel|carcel|fall|fracas|robo|estafa|enferm|muerte|muere|atac|accidente|penal)/i;

  const style = document.createElement("style");
  style.id = "flEventJuiceCss";
  style.textContent = `
    @keyframes flEjIn {
      0% { opacity: 0; transform: translateY(18px) scale(.9); }
      70% { opacity: 1; transform: translateY(-2px) scale(1.012); }
      100% { opacity: 1; transform: none; }
    }
    @keyframes flEjShake {
      10%, 90% { transform: translate3d(-2px, 0, 0) rotate(-.25deg); }
      20%, 80% { transform: translate3d(4px, 0, 0) rotate(.25deg); }
      30%, 50%, 70% { transform: translate3d(-6px, 0, 0) rotate(-.35deg); }
      40%, 60% { transform: translate3d(6px, 0, 0) rotate(.35deg); }
      100% { transform: none; }
    }
    @keyframes flEjGood {
      0% { box-shadow: 0 0 0 0 rgba(51, 196, 90, .65); }
      100% { box-shadow: 0 0 0 24px rgba(51, 196, 90, 0); }
    }
    @keyframes flEjBad {
      0% { box-shadow: 0 0 0 0 rgba(220, 50, 40, .65); }
      100% { box-shadow: 0 0 0 24px rgba(220, 50, 40, 0); }
    }
    .jcw.fl-ej-in { animation: flEjIn .28s cubic-bezier(.2, 1.25, .3, 1) both; }
    .jcw.fl-ej-shake { animation: flEjShake .5s cubic-bezier(.36, .07, .19, .97) both; }
    .jcw.fl-ej-good { animation: flEjIn .28s cubic-bezier(.2, 1.25, .3, 1) both, flEjGood .7s ease-out .2s both; }
    .jcw.fl-ej-bad { animation: flEjIn .28s cubic-bezier(.2, 1.25, .3, 1) both, flEjBad .7s ease-out .2s both; }
    @media (prefers-reduced-motion: reduce) {
      .jcw.fl-ej-in, .jcw.fl-ej-shake, .jcw.fl-ej-good, .jcw.fl-ej-bad { animation: none !important; }
    }
  `;
  document.head.appendChild(style);

  function toneOf(opts) {
    if (!opts) return "neutral";
    if (opts.green) return "good";
    const rows = Array.isArray(opts.rows) ? opts.rows : [];
    const choices = Array.isArray(opts.choices) ? opts.choices : [];
    const text = [
      opts.tag,
      opts.title,
      opts.lead,
      ...rows.map((r) => `${r[0]} ${r[1]}`),
      ...choices.map((c) => c[0]),
    ]
      .filter(Boolean)
      .join(" ");
    if (BAD.test(text)) return "bad";
    if (GOOD.test(text)) return "good";
    const vals = rows.map((r) => String(r[1] ?? ""));
    if (vals.some((v) => /^[−-]\s*[$€£]?\d/.test(v))) return "bad";
    if (vals.some((v) => /^\+\s*[$€£]?\d/.test(v))) return "good";
    return "neutral";
  }

  function sound(name) {
    try {
      if (typeof play === "function") play(name);
    } catch {}
  }

  function vibrate(pattern) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch {}
  }

  function animate(tone) {
    const ev = document.getElementById("ev");
    const card = ev && ev.querySelector(".jcw");
    if (!card) return;
    card.classList.remove("fl-ej-in", "fl-ej-shake", "fl-ej-good", "fl-ej-bad");
    void card.offsetWidth;
    card.classList.add("fl-ej-in");
    if (tone === "bad") {
      card.classList.add("fl-ej-bad");
      setTimeout(() => card.classList.add("fl-ej-shake"), 45);
      sound("buzzer");
      vibrate([90, 50, 90]);
    } else if (tone === "good") {
      card.classList.add("fl-ej-good");
      sound("ding");
      setTimeout(() => sound("coins"), 130);
      vibrate([35, 35, 35]);
    }
  }

  function boot() {
    if (typeof jCard !== "function" || !document.getElementById("ev")) return setTimeout(boot, 80);
    if (jCard.__flEventJuice) return;
    const orig = jCard;
    const wrapped = function (opts) {
      const result = orig.apply(this, arguments);
      try {
        setTimeout(() => animate(toneOf(opts)), 15);
      } catch (e) {
        console.warn("[event-juice]", e);
      }
      return result;
    };
    wrapped.__flEventJuice = true;
    window.jCard = wrapped;
    window.FL_EVENT_JUICE = {
      tone: toneOf,
      replay: (tone) => animate(tone || "neutral"),
    };
    window.FL_EVENT_JUICE_LOADING = false;
  }

  boot();
})();
