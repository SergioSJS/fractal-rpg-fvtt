const MACROS = [
  {
    name:    "Fractal — Fim de Episódio",
    flag:    "fim-episodio",
    command: `
// Distribui XP de fim de episódio para todos os personagens do mundo.
const xpPorEpisodio = game.settings.get("fractal-rpg", "xpEpisodio") ?? 3;
const personagens = game.actors.filter(a => a.type === "personagem");
if (!personagens.length) { ui.notifications.warn("Nenhum personagem encontrado."); return; }

for (const actor of personagens) {
  await actor.update({ "system.xp.value": actor.system.xp.value + xpPorEpisodio });
}
ChatMessage.create({
  content: \`🎬 <b>Fim de Episódio</b> — +\${xpPorEpisodio} XP para \${personagens.length} personagem(ns).\`
});
`,
  },
  {
    name:    "Fractal — Fim de Arco",
    flag:    "fim-arco",
    command: `
// Distribui XP de fim de arco para todos os personagens do mundo.
const xpPorArco = game.settings.get("fractal-rpg", "xpArco") ?? 10;
const personagens = game.actors.filter(a => a.type === "personagem");
if (!personagens.length) { ui.notifications.warn("Nenhum personagem encontrado."); return; }

for (const actor of personagens) {
  await actor.update({ "system.xp.value": actor.system.xp.value + xpPorArco });
}
ChatMessage.create({
  content: \`🏆 <b>Fim de Arco</b> — +\${xpPorArco} XP para \${personagens.length} personagem(ns)!\`
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
      name:    def.name,
      type:    "script",
      img:     "icons/svg/d20-black.svg",
      command: def.command.trim(),
      flags:   { "fractal-rpg": { macro: def.flag, version } },
    });
  }
}
