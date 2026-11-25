// Copies the game into mobile/www for Capacitor.
//   node prepare-www.mjs          copy
//   node prepare-www.mjs --dry    only count what would be copied
// Left out: git/CI files, the service-worker packs (the app already has every file locally), art sources, scratch.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const out = join(here, "www");
const dry = process.argv.includes("--dry");

const SKIP_DIRS = new Set([".git", ".github", "mobile", "node_modules", "packs", "_art-src", "_original", "_rea-export", "GRIDS", "dev", "work"]);
const SKIP_PATHS = new Set(["i18n/work", "i18n/_backup"]);
const SKIP_FILES = /^(sw\.js|index\.html|CONTEXT\.md|README\.md|\.gitignore|cand_wide.*\.png|yl_preview\.png|p[0-9]\.png)$/i;
const SKIP_EXT = /\.(bak|psd|tsv|md|log|map)$|\.bak-/i;

let files = 0;
let bytes = 0;
const filter = (src) => {
  const rel = relative(root, src).split(sep).join("/");
  if (!rel) return true;
  const name = rel.split("/").pop();
  const st = statSync(src);
  if (st.isDirectory()) {
    if (rel.indexOf("/") < 0 && SKIP_DIRS.has(name)) return false;
    if (SKIP_PATHS.has(rel)) return false;
    return true;
  }
  if (rel.indexOf("/") < 0 && SKIP_FILES.test(name)) return false;
  if (SKIP_EXT.test(name)) return false;
  files++;
  bytes += st.size;
  return true;
};

if (!dry) {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  // copy the top-level entries one by one: Node refuses to copy a folder into a subfolder of itself (mobile/www is inside the repo)
  for (const name of readdirSync(root)) {
    cpSync(join(root, name), join(out, name), { recursive: true, filter });
  }
  // the launcher only existed for the web service worker: the app opens the game directly
  writeFileSync(
    join(out, "index.html"),
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta http-equiv="refresh" content="0;url=game.html"><style>html,body{margin:0;height:100%;background:#1d3a6b}</style></head><body><script>location.replace("game.html")</script></body></html>',
  );
} else {
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (filter(p) && statSync(p).isDirectory()) walk(p);
    }
  };
  walk(root);
}
console.log(`${dry ? "[dry] " : ""}${files} files, ${(bytes / 1e6).toFixed(1)} MB${dry ? "" : " -> mobile/www"}`);
if (!dry && !existsSync(join(out, "game.html"))) {
  console.error("game.html missing in www");
  process.exit(1);
}
