const TEMPLATE = "systems/fractal-rpg/templates/chat/risk-roll.hbs";

function _buildTemplateData(actor, rollResult, acao, fatosNomes, rupturasPendentes = false) {
  const { resultados, maior, tipoResultado, ehImpulso, rupturas, fatosRompidos, semFatos } = rollResult;
  return {
    actorName: actor.name,
    acao:      acao || "",
    resultados,
    maior,
    tipoResultado,
    ehImpulso,
    rupturas,
    fatosRompidos:     fatosRompidos ?? [],
    rupturasPendentes,
    fatosNomes,
    semFatos,
    xpGanho:        tipoResultado === "falha",
    labelResultado: game.i18n.localize(tipoResultado === "sucesso"
      ? (ehImpulso ? "FRACTAL.Roll.Impulso" : "FRACTAL.Roll.Sucesso")
      : "FRACTAL.Roll.Falha"),
  };
}

export async function createRollMessage(actor, rollResult, acao, fatosNomes) {
  const temRupturas  = rollResult.rupturas > 0 && rollResult.fatosRompidos?.length === 0;
  const templateData = _buildTemplateData(actor, rollResult, acao, fatosNomes, temRupturas);
  const content      = await foundry.applications.handlebars.renderTemplate(TEMPLATE, templateData);

  // Criar a mensagem via ChatMessage.create para poder atualizar o content depois
  const speaker  = ChatMessage.getSpeaker({ actor });

  const msgData = {
    speaker,
    content,
    rolls:   [rollResult.roll],
    sound:   CONFIG.sounds.dice,
  };

  // v14 trocou rollMode por messageMode; o caminho antigo só emite aviso de depreciação.
  if (ChatMessage.applyMode) ChatMessage.applyMode(msgData, game.settings.get("core", "messageMode"));
  else ChatMessage.applyRollMode(msgData, game.settings.get("core", "rollMode"));

  const msg = await ChatMessage.create(msgData);
  return { msg, templateData };
}

export async function updateRollMessageRupturas(msg, templateData, fatosRompidos) {
  templateData.fatosRompidos     = fatosRompidos;
  templateData.rupturasPendentes = false;
  const newContent = await foundry.applications.handlebars.renderTemplate(TEMPLATE, templateData);
  await msg.update({ content: newContent });
}
