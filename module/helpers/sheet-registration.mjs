import { FractalActorSheet } from "../sheets/actor-sheet.mjs";
import { FractalDesafioSheet } from "../sheets/desafio-sheet.mjs";

export function registerSheets() {
  foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);

  foundry.documents.collections.Actors.registerSheet("fractal-rpg", FractalActorSheet, {
    types: ["personagem"],
    makeDefault: true,
    label: "FRACTAL.Sheet.Personagem",
  });

  foundry.documents.collections.Actors.registerSheet("fractal-rpg", FractalDesafioSheet, {
    types: ["desafio"],
    makeDefault: true,
    label: "FRACTAL.Sheet.Desafio",
  });
}
