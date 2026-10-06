const MACROS = [
  {
    name:    "FRACTAL.Macro.FimEpisodio",
    flag:    "fim-episodio",
    command: `
// Distribui XP de fim de episódio para todos os personagens do mundo.
const xp = game.settings.get("fractal-rpg", "xpEpisodio") ?? 3;
const personagens = game.actors.filter(a => a.type === "personagem");
if (!personagens.length) { ui.notifications.warn(game.i18n.localize("FRACTAL.Macro.SemPersonagens")); return; }

for (const actor of personagens) {
  await actor.update({ "system.xp.value": actor.system.xp.value + xp });
}
ChatMessage.create({
  content: game.i18n.format("FRACTAL.Macro.MsgFimEpisodio", { xp, n: personagens.length })
});
`,
  },
  {
    name:    "FRACTAL.Macro.FimArco",
    flag:    "fim-arco",
    command: `
// Distribui XP de fim de arco para todos os personagens do mundo.
const xp = game.settings.get("fractal-rpg", "xpArco") ?? 10;
const personagens = game.actors.filter(a => a.type === "personagem");
if (!personagens.length) { ui.notifications.warn(game.i18n.localize("FRACTAL.Macro.SemPersonagens")); return; }

for (const actor of personagens) {
  await actor.update({ "system.xp.value": actor.system.xp.value + xp });
}
ChatMessage.create({
  content: game.i18n.format("FRACTAL.Macro.MsgFimArco", { xp, n: personagens.length })
});
`,
  },
];

export async function setupMacros() {
  if (!game.user.isGM) return;
  const version = game.system.version;

  for (const def of MACROS) {
    const existing = game.macros.find(m => m.getFlag("fractal-rpg", "macro") === def.flag);
    if (existing?.getFlag("fractal-rpg", "version") === version) continue;
    if (existing) await existing.delete();

    await Macro.create({
      name:    game.i18n.localize(def.name),
      type:    "script",
      img:     "icons/svg/d20-black.svg",
      command: def.command.trim(),
      flags:   { "fractal-rpg": { macro: def.flag, version } },
    });
  }
}
