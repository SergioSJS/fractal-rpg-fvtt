import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";
import { createRequire } from "node:module";

const ROOT = new URL("..", import.meta.url).pathname;
const IDIOMAS = ["pt-BR", "en"];

function chaves(obj, prefixo = "") {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? chaves(v, `${prefixo}${k}.`) : [`${prefixo}${k}`]);
}

function arquivos(dir, exts) {
  return readdirSync(join(ROOT, dir), { recursive: true })
    .filter(f => exts.includes(extname(f)))
    .map(f => join(ROOT, dir, f));
}

const lang = Object.fromEntries(IDIOMAS.map(l =>
  [l, new Set(chaves(JSON.parse(readFileSync(join(ROOT, "lang", `${l}.json`), "utf8"))))]));

test("os idiomas têm as mesmas chaves", () => {
  const [a, b] = IDIOMAS;
  assert.deepEqual([...lang[a]].filter(k => !lang[b].has(k)), [], `faltam em ${b}`);
  assert.deepEqual([...lang[b]].filter(k => !lang[a].has(k)), [], `faltam em ${a}`);
});

test("toda chave FRACTAL.* usada no código existe", () => {
  const usadas = new Set();
  for (const f of [...arquivos("module", [".mjs"]), ...arquivos("templates", [".hbs"])]) {
    for (const m of readFileSync(f, "utf8").matchAll(/FRACTAL\.[A-Za-z0-9_.]+[A-Za-z0-9_]/g)) usadas.add(m[0]);
  }
  const faltando = [...usadas].filter(k => !lang["pt-BR"].has(k));
  assert.deepEqual(faltando, []);
});

test("todo template compila", (t) => {
  let Handlebars;
  try { Handlebars = createRequire(import.meta.url)("handlebars"); }
  catch { return t.skip("pacote handlebars não instalado"); }
  for (const f of arquivos("templates", [".hbs"])) {
    assert.doesNotThrow(() => Handlebars.precompile(readFileSync(f, "utf8")), f);
  }
});
