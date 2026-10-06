import { quantidadeDeDados, avaliarRisco } from "../rules/risco.mjs";

/** Executa uma Rolagem de Risco; a regra fica em rules/risco.mjs. Falha dá +1 XP. */
export async function rolagemDeRisco(actor, fatosAplicados, temVantagem) {
  const semFatos = fatosAplicados.length === 0;
  const qtdDados = quantidadeDeDados(fatosAplicados.length, temVantagem);

  const roll = new Roll(`${qtdDados}d6`);
  await roll.evaluate();

  const resultados = roll.dice[0].results.map(r => r.result);
  const { maior, tipoResultado, ehImpulso, rupturas } = avaliarRisco(resultados, semFatos);

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
      nomes.push(fato.texto || game.i18n.localize("FRACTAL.Comum.FatoSemNome"));
    }
  }
  await actor.update({ "system.fatos": fatos });
  return nomes;
}
