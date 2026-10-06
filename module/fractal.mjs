import { PersonagemData } from "./data/actor-personagem.mjs";
import { DesafioData } from "./data/actor-desafio.mjs";
import { GrupoData } from "./data/actor-grupo.mjs";
import { FatoItemData } from "./data/item-fato.mjs";
import { registerSheets } from "./helpers/sheet-registration.mjs";
import { registerSettings, injectCustomCSS, applyAccentColor } from "./settings/register.mjs";
import { CONFIG_PARTIALS } from "./settings/reservas-config-app.mjs";
import { setupMacros } from "./helpers/macros.mjs";
import { clockPanel } from "./helpers/clock-panel.mjs";

Hooks.once("init", () => {
  console.log("Fractal RPG | Inicializando sistema");

  CONFIG.Actor.dataModels.personagem = PersonagemData;
  CONFIG.Actor.dataModels.desafio    = DesafioData;
  CONFIG.Actor.dataModels.grupo      = GrupoData;
  CONFIG.Item.dataModels.fato        = FatoItemData;

  registerSettings();
  registerSheets();
  foundry.applications.handlebars.loadTemplates(CONFIG_PARTIALS);

  Handlebars.registerHelper("times", (n, block) => {
    let result = "";
    for (let i = 0; i < n; i++) result += block.fn(i);
    return result;
  });

  Handlebars.registerHelper("lte", (a, b) => a <= b);
  Handlebars.registerHelper("eq",  (a, b) => a === b);
  Handlebars.registerHelper("gt",  (a, b) => a > b);
});

Hooks.once("ready", async () => {
  const css = game.settings.get("fractal-rpg", "cssCustomizado");
  if (css) injectCustomCSS(css);

  // Sanitize corAccent — previous bug stored array/nested JSON instead of hex color
  let cor = game.settings.get("fractal-rpg", "corAccent") ?? "#8B0000";
  if (!/^#[0-9a-fA-F]{6}$/.test(cor)) {
    cor = "#8B0000";
    if (game.user?.isGM) await game.settings.set("fractal-rpg", "corAccent", cor);
  }
  applyAccentColor(cor);

  await setupMacros();
  clockPanel.render();
});

for (const hook of ["createActor", "updateActor", "deleteActor"]) {
  Hooks.on(hook, actor => {
    if (["desafio", "grupo"].includes(actor.type)) clockPanel.render();
  });
}

Hooks.on("preCreateActor", (actor, data) => {
  if (data.img && data.img !== "icons/svg/mystery-man.svg") return;
  const defaults = {
    personagem: "icons/svg/mystery-man.svg",
    desafio:    "icons/svg/skull.svg",
    grupo:      "icons/svg/village.svg",
  };
  const img = defaults[actor.type];
  if (img) actor.updateSource({ img });
});

