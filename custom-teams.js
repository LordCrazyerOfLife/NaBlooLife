/* [mod] Edit Sports Teams: overlay sobre FL_FUTBOL_DATA. Corre antes de futbol.js (dep del mod Football Career),
 * así las ligas ya salen con los cambios. Datos en localStorage["freelife-custom-teams"]:
 * { edits: { [clubId]: { name, rep, leagueId } }, added: [{ id, name, rep, leagueId }] }
 * El editor vive en custom-content.js. */
(() => {
  "use strict";
  if (window.FL_CUSTOM_TEAMS) return;

  const KEY = "freelife-custom-teams";
  const read = () => {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "null");
      return d && typeof d === "object" ? { edits: d.edits || {}, added: Array.isArray(d.added) ? d.added : [] } : { edits: {}, added: [] };
    } catch {
      return { edits: {}, added: [] };
    }
  };
  const clampRep = (n) => Math.max(1, Math.min(100, Math.round(Number(n) || 50)));

  function apply() {
    const data = window.FL_FUTBOL_DATA;
    if (!data || !Array.isArray(data.leagues)) return;
    const { edits, added } = read();
    const leagues = data.leagues;
    const moves = [];

    for (const l of leagues) {
      if (!Array.isArray(l.clubs)) continue;
      for (const c of l.clubs.slice()) {
        const e = edits[c.id];
        if (!e) continue;
        if (e.name) c.name = String(e.name).slice(0, 40);
        if (e.rep != null) c.rep = clampRep(e.rep);
        if (e.leagueId && e.leagueId !== l.id) {
          moves.push({ c, from: l, to: e.leagueId });
          l.clubs.splice(l.clubs.indexOf(c), 1);
        }
      }
    }
    for (const m of moves) {
      const to = leagues.find((x) => x.id === m.to);
      if (to && Array.isArray(to.clubs)) to.clubs.push(m.c);
      else m.from.clubs.push(m.c);
    }
    for (const a of added) {
      const l = leagues.find((x) => x.id === a.leagueId);
      if (!l || !Array.isArray(l.clubs) || l.clubs.some((c) => c.id === a.id)) continue;
      l.clubs.push({ id: a.id, name: String(a.name).slice(0, 40), rep: clampRep(a.rep), logo: "" });
    }
  }

  apply();
  window.FL_CUSTOM_TEAMS = { read, apply };
})();
