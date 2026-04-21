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
    labelResultado: tipoResultado === "sucesso"
      ? (ehImpulso ? "⚡ IMPULSO" : "✅ SUCESSO")
      : "❌ FALHA",
  };
}

export async function createRollMessage(actor, rollResult, acao, fatosNomes) {
  const temRupturas  = rollResult.rupturas > 0 && rollResult.fatosRompidos?.length === 0;
  const templateData = _buildTemplateData(actor, rollResult, acao, fatosNomes, temRupturas);
  const content      = await foundry.applications.handlebars.renderTemplate(TEMPLATE, templateData);

  // Criar a mensagem via ChatMessage.create para poder atualizar o content depois
  const speaker  = ChatMessage.getSpeaker({ actor });
  const rollMode = game.settings.get("core", "rollMode");

  let msgData = {
    speaker,
    content,
    rolls:   [rollResult.roll],
    sound:   CONFIG.sounds.dice,
  };

  // Aplicar rollMode (blind, gmroll, etc.)
  if (rollMode === CONST.DICE_ROLL_MODES.BLIND) {
    msgData.blind = true;
  } else if (rollMode === CONST.DICE_ROLL_MODES.PRIVATE) {
    msgData.whisper = ChatMessage.getWhisperRecipients("gm");
  } else if (rollMode === CONST.DICE_ROLL_MODES.SELF) {
    msgData.whisper = [game.user.id];
  }

  const msg = await ChatMessage.create(msgData);
  return { msg, templateData };
}

export async function updateRollMessageRupturas(msg, templateData, fatosRompidos) {
  templateData.fatosRompidos     = fatosRompidos;
  templateData.rupturasPendentes = false;
  const newContent = await foundry.applications.handlebars.renderTemplate(TEMPLATE, templateData);
  await msg.update({ content: newContent });
}
