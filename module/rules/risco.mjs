// Regra pura da Rolagem de Risco — sem dependência do Foundry, testada em tests/.

export const MAX_FATOS = 3;
export const MAX_DADOS = 4;

/** 1 dado por Fato (máx 3); Vantagem soma 1 dado (máx 4); sem Fatos, 1 dado. */
export function quantidadeDeDados(qtdFatos, vantagem = false) {
  if (qtdFatos <= 0) return 1;
  const base = Math.min(qtdFatos, MAX_FATOS);
  return vantagem ? Math.min(base + 1, MAX_DADOS) : base;
}

/**
 * Sucesso: maior >= 5 com Fatos, ou 6 sem Fatos.
 * Impulso: 2+ seis num sucesso. Ruptura: cada 1 pode quebrar um Fato usado.
 */
export function avaliarRisco(resultados, semFatos) {
  const maior    = Math.max(...resultados);
  const seis     = resultados.filter(r => r === 6).length;
  const rupturas = resultados.filter(r => r === 1).length;
  const sucesso  = semFatos ? maior === 6 : maior >= 5;
  return {
    maior,
    tipoResultado: sucesso ? "sucesso" : "falha",
    ehImpulso:     sucesso && seis >= 2,
    rupturas,
  };
}
