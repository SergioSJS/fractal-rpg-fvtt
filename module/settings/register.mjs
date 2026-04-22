import { ReservasConfigApp } from "./reservas-config-app.mjs";

export function registerSettings() {
  game.settings.register("fractal-rpg", "reservasPersonagem", {
    scope:   "world",
    config:  false,
    type:    Object,
    default: [],
    onChange: () => _reRenderSheetsByType("personagem"),
  });

  game.settings.register("fractal-rpg", "reservasDesafio", {
    scope:   "world",
    config:  false,
    type:    Object,
    default: [],
    onChange: () => _reRenderSheetsByType("desafio"),
  });

  game.settings.register("fractal-rpg", "fatosPersonagem", {
    scope:   "world",
    config:  false,
    type:    Object,
    default: [],
    onChange: () => _reRenderSheetsByType("personagem"),
  });

  game.settings.register("fractal-rpg", "fatosDesafio", {
    scope:   "world",
    config:  false,
    type:    Object,
    default: [],
    onChange: () => _reRenderSheetsByType("desafio"),
  });

  game.settings.register("fractal-rpg", "fatosGrupo", {
    scope:   "world",
    config:  false,
    type:    Object,
    default: [],
    onChange: () => _reRenderSheetsByType("grupo"),
  });

  game.settings.register("fractal-rpg", "backgroundGrupo", {
    scope:   "world",
    config:  false,
    type:    String,
    default: "",
    onChange: () => _reRenderSheetsByType("grupo"),
  });

  game.settings.register("fractal-rpg", "bgOpacidadeGrupo", {
    scope:   "world",
    config:  false,
    type:    Number,
    default: 0.25,
    onChange: () => _reRenderSheetsByType("grupo"),
  });

  game.settings.register("fractal-rpg", "cssCustomizado", {
    scope:   "world",
    config:  false,
    type:    String,
    default: "",
    onChange: (css) => injectCustomCSS(css),
  });

  game.settings.register("fractal-rpg", "backgroundPersonagem", {
    scope:   "world",
    config:  false,
    type:    String,
    default: "",
    onChange: () => _reRenderSheetsByType("personagem"),
  });

  game.settings.register("fractal-rpg", "backgroundDesafio", {
    scope:   "world",
    config:  false,
    type:    String,
    default: "",
    onChange: () => _reRenderSheetsByType("desafio"),
  });

  game.settings.register("fractal-rpg", "bgOpacidadePersonagem", {
    scope:   "world",
    config:  false,
    type:    Number,
    default: 0.25,
    onChange: () => _reRenderSheetsByType("personagem"),
  });

  game.settings.register("fractal-rpg", "bgOpacidadeDesafio", {
    scope:   "world",
    config:  false,
    type:    Number,
    default: 0.25,
    onChange: () => _reRenderSheetsByType("desafio"),
  });

  game.settings.register("fractal-rpg", "corAccent", {
    scope:   "world",
    config:  false,
    type:    String,
    default: "#8B0000",
    onChange: (cor) => applyAccentColor(cor),
  });

  game.settings.register("fractal-rpg", "corAccentDesafio", {
    scope:   "world",
    config:  false,
    type:    String,
    default: "#5c3317",
    onChange: () => _reRenderSheetsByType("desafio"),
  });

  game.settings.register("fractal-rpg", "corAccentGrupo", {
    scope:   "world",
    config:  false,
    type:    String,
    default: "#0d5c2e",
    onChange: () => _reRenderSheetsByType("grupo"),
  });

  game.settings.register("fractal-rpg", "xpEpisodio", {
    scope:   "world",
    config:  true,
    name:    "FRACTAL.Settings.XPEpisodio",
    type:    Number,
    default: 3,
  });

  game.settings.register("fractal-rpg", "xpArco", {
    scope:   "world",
    config:  true,
    name:    "FRACTAL.Settings.XPArco",
    type:    Number,
    default: 10,
  });

  game.settings.registerMenu("fractal-rpg", "menuFractal", {
    name:       "FRACTAL.Settings.MenuFractal.Nome",
    label:      "FRACTAL.Settings.MenuFractal.Label",
    hint:       "FRACTAL.Settings.MenuFractal.Dica",
    icon:       "fas fa-cogs",
    type:       ReservasConfigApp,
    restricted: true,
  });
}

export function applyAccentColor(cor) {
  document.documentElement.style.setProperty("--f-accent", cor || "#8B0000");
  document.documentElement.style.setProperty("--f-accent2", cor || "#8B0000");
}

export function injectCustomCSS(css) {
  let el = document.getElementById("fractal-custom-css");
  if (!el) {
    el = document.createElement("style");
    el.id = "fractal-custom-css";
    document.head.appendChild(el);
  }
  el.textContent = css ?? "";
}

function _reRenderSheetsByType(type) {
  for (const app of Object.values(ui.windows ?? {})) {
    if (app.document?.type === type) app.render(false);
  }
}
