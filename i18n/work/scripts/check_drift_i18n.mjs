// Comprueba cuantos strings de drift_in.tsv ya resuelven con es.js (exacto o regla).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const I18N = path.resolve(HERE, "..", "..");
const dict = { exact: new Map(), re: [] };
globalThis.FL_I18N = { add: (code, d) => {
  for (const [k, v] of Object.entries(d.exact || {})) dict.exact.set(k.replace(/\s+/g, " ").trim().toLowerCase(), v);
  for (const [src, out] of d.re || []) dict.re.push([new RegExp(src, "i"), out]);
} };
const src = fs.readFileSync(path.join(I18N, "es.js"), "utf8");
new Function(src)();
const rules = fs.readFileSync(path.join(I18N, "rules.tsv"), "utf8").split("\n").filter((l) => l.includes("\t")).length;
console.log("claves exactas:", dict.exact.size, "| reglas en rules.tsv:", rules, "| reglas compiladas:", dict.re.length);

const norm = (s) => s.replace(/\s+/g, " ").trim();
function translate(raw) {
  const s = norm(raw);
  if (dict.exact.has(s.toLowerCase())) return dict.exact.get(s.toLowerCase());
  const p = /^(.*?)(\s*(?:\.\.\.|…|[:!?.]+))$/.exec(s);
  if (p && dict.exact.has(p[1].toLowerCase())) return dict.exact.get(p[1].toLowerCase()) + p[2];
  for (const [re, rep] of dict.re) if (re.test(s)) return rep;
  return null;
}

const list = fs.readFileSync(path.join(I18N, "work", "drift_in.tsv"), "utf8").split(/\r?\n/).filter(Boolean);
let ok = 0, bad = [];
for (const line of list) {
  const en = line.split("\t")[0];
  if (translate(en)) ok++;
  else bad.push(en);
}
console.log(`traducidos: ${ok}/${list.length}`);
console.log("SIN traducir:");
for (const s of bad) console.log("  " + s);
