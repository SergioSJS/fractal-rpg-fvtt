export function applySheetAppearance(sheetElement, actorType) {
  const isPersonagem = actorType === "personagem";
  const bg      = game.settings.get("fractal-rpg", isPersonagem ? "backgroundPersonagem" : "backgroundDesafio") || "";
  const opacity = game.settings.get("fractal-rpg", isPersonagem ? "bgOpacidadePersonagem" : "bgOpacidadeDesafio") ?? 0.25;
  const cor     = game.settings.get("fractal-rpg", "corAccent") || "#8B0000";

  sheetElement.style.setProperty("--f-bg-img",        bg ? `url("${bg}")` : "none");
  sheetElement.style.setProperty("--f-bg-img-opacity", String(opacity));
  sheetElement.style.setProperty("--f-accent",  cor);
  sheetElement.style.setProperty("--f-accent2", cor);
}
