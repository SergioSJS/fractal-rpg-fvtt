export async function createRollMessage(actor, rollResult, acao, fatosNomes) {
  const { roll, resultados, maior, tipoResultado, ehImpulso, rupturas, fatosRompidos, semFatos } = rollResult;

  const templateData = {
    actorName:    actor.name,
    acao:         acao || "",
    resultados,
    maior,
    tipoResultado,
    ehImpulso,
    rupturas,
    fatosRompidos,
    fatosNomes,
    semFatos,
    xpGanho:      tipoResultado === "falha",
    labelResultado: tipoResultado === "sucesso"
      ? (ehImpulso ? "⚡ IMPULSO" : "✅ SUCESSO")
      : "❌ FALHA",
  };

  const content = await foundry.applications.handlebars.renderTemplate(
    "systems/fractal-rpg/templates/chat/risk-roll.hbs",
    templateData
  );

  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor:  content,
    rollMode: game.settings.get("core", "rollMode"),
  });
}
