export function applySheetAppearance(sheetElement, actorType) {
  const bgKey = actorType === "personagem" ? "backgroundPersonagem"
              : actorType === "grupo"      ? "backgroundGrupo"
              :                              "backgroundDesafio";
  const opKey = actorType === "personagem" ? "bgOpacidadePersonagem"
              : actorType === "grupo"      ? "bgOpacidadeGrupo"
              :                              "bgOpacidadeDesafio";
  const accentKey = actorType === "desafio" ? "corAccentDesafio"
                  : actorType === "grupo"   ? "corAccentGrupo"
                  :                           "corAccent";
  const bg      = game.settings.get("fractal-rpg", bgKey) || "";
  const opacity = game.settings.get("fractal-rpg", opKey) ?? 0.25;
  const cor     = game.settings.get("fractal-rpg", accentKey) || "#8B0000";

  sheetElement.style.setProperty("--f-bg-img",        bg ? `url("${bg}")` : "none");
  sheetElement.style.setProperty("--f-bg-img-opacity", String(opacity));
  sheetElement.style.setProperty("--f-accent",  cor);
  sheetElement.style.setProperty("--f-accent2", cor);
}
