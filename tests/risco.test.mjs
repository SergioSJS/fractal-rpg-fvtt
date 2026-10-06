import { test } from "node:test";
import assert from "node:assert/strict";
import { quantidadeDeDados, avaliarRisco, MAX_FATOS, MAX_DADOS } from "../module/rules/risco.mjs";

test("sem Fatos rola 1 dado, com ou sem Vantagem", () => {
  assert.equal(quantidadeDeDados(0), 1);
  assert.equal(quantidadeDeDados(0, true), 1);
});

test("1 dado por Fato até o teto", () => {
  assert.equal(quantidadeDeDados(1), 1);
  assert.equal(quantidadeDeDados(3), MAX_FATOS);
  assert.equal(quantidadeDeDados(5), MAX_FATOS);
});

test("Vantagem soma 1 dado sem passar do teto", () => {
  assert.equal(quantidadeDeDados(1, true), 2);
  assert.equal(quantidadeDeDados(3, true), MAX_DADOS);
  assert.equal(quantidadeDeDados(9, true), MAX_DADOS);
});

test("com Fatos, 5 ou 6 é sucesso", () => {
  assert.equal(avaliarRisco([5, 2], false).tipoResultado, "sucesso");
  assert.equal(avaliarRisco([4, 3], false).tipoResultado, "falha");
});

test("sem Fatos, só 6 é sucesso", () => {
  assert.equal(avaliarRisco([5], true).tipoResultado, "falha");
  assert.equal(avaliarRisco([6], true).tipoResultado, "sucesso");
});

test("Impulso exige sucesso com dois ou mais 6", () => {
  assert.equal(avaliarRisco([6, 6, 1], false).ehImpulso, true);
  assert.equal(avaliarRisco([6, 5], false).ehImpulso, false);
});

test("cada 1 é uma Ruptura, mesmo em sucesso", () => {
  const r = avaliarRisco([1, 1, 6], false);
  assert.equal(r.rupturas, 2);
  assert.equal(r.tipoResultado, "sucesso");
  assert.equal(r.maior, 6);
});
