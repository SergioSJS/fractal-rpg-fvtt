/**
 * Executa uma Rolagem de Risco do Fractal RPG.
 *
 * Regras (design doc seção 4.1):
 * - 1 dado por Fato aplicado, máx 3 (ou 4 com Vantagem)
 * - Sem Fatos: 1 dado, sucesso só no 6
 * - Sucesso: maior >= 5 (com Fatos) | maior = 6 (sem Fatos)
 * - Impulso: 2+ dados com 6 em um sucesso
 * - Ruptura: cada dado com 1 pode romper um Fato usado (jogador escolhe)
 * - Falha: +1 XP automático
 */
export async function rolagemDeRisco(actor, fatosAplicados, temVantagem) {
  const semFatos = fatosAplicados.length === 0;
  let qtdDados = semFatos ? 1 : Math.min(fatosAplicados.length, 3);

  if (temVantagem && !semFatos) qtdDados = Math.min(qtdDados + 1, 4);

  const roll = new Roll(`${qtdDados}d6`);
  await roll.evaluate();

  const resultados = roll.dice[0].results.map(r => r.result);
  const maior      = Math.max(...resultados);
  const impulsos   = resultados.filter(r => r === 6).length;
  const rupturas   = resultados.filter(r => r === 1).length;

  const tipoResultado = (semFatos ? maior === 6 : maior >= 5) ? "sucesso" : "falha";
  const ehImpulso     = tipoResultado === "sucesso" && impulsos >= 2;

  // XP em falha
  if (tipoResultado === "falha") {
    await actor.update({ "system.xp.value": actor.system.xp.value + 1 });
  }

  // Rupturas são aplicadas pelo jogador via roll-dialog após a rolagem
  return { roll, resultados, maior, qtdDados, tipoResultado, ehImpulso, rupturas, fatosRompidos: [], semFatos };
}

export async function aplicarRupturas(actor, fatosIds) {
  if (!fatosIds.length) return [];
  const fatos = foundry.utils.deepClone(actor.system.fatos);
  const nomes = [];
  for (const id of fatosIds) {
    const fato = fatos.find(f => f.id === id);
    if (fato && !fato.rompido) {
      fato.rompido = true;
      nomes.push(fato.texto || "(Fato sem nome)");
    }
  }
  await actor.update({ "system.fatos": fatos });
  return nomes;
}
