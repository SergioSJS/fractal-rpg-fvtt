import { applySheetAppearance } from "../helpers/appearance.mjs";

const { api, sheets } = foundry.applications;

export class FractalGrupoSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["fractal-rpg", "sheet", "actor", "grupo"],
    window:  { resizable: true },
    position: { width: 620, height: 720 },
    form: { submitOnChange: true },
    actions: {
      addFato:             FractalGrupoSheet.#addFato,
      removeFato:          FractalGrupoSheet.#removeFato,
      toggleRompido:       FractalGrupoSheet.#toggleRompido,
      addCustomReserva:    FractalGrupoSheet.#addCustomReserva,
      removeCustomReserva: FractalGrupoSheet.#removeCustomReserva,
      decrementCustom:     FractalGrupoSheet.#decrementCustom,
      incrementCustom:     FractalGrupoSheet.#incrementCustom,
      togglePin:           FractalGrupoSheet.#togglePin,
    },
  };

  static PARTS = {
    body: { template: "systems/fractal-rpg/templates/actor/grupo-sheet.hbs" },
  };

  get title() { return this.document.name; }

  async _prepareContext(options) {
    const reservasCustom = (this.actor.system.reservasCustom ?? []).map(r => ({
      ...r,
      tracker: Array.from({ length: r.total }, (_, i) => ({ filled: i < r.atual })),
    }));

    return {
      actor:         this.document,
      system:        this.document.system,
      editable:      this.isEditable,
      owner:         this.document.isOwner,
      isGM:          game.user?.isGM ?? false,
      reservasCustom,
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);

    const sheet = this.element.querySelector(".fractal-sheet");
    if (sheet) applySheetAppearance(sheet, "desafio");

    this.element.querySelectorAll(".fato-texto[data-fato-idx]").forEach(input => {
      input.addEventListener("change", async e => {
        const idx   = parseInt(e.target.dataset.fatoIdx);
        const fatos = foundry.utils.deepClone(this.actor.system.fatos);
        if (fatos[idx] !== undefined) {
          fatos[idx].texto = e.target.value;
          await this.actor.update({ "system.fatos": fatos });
        }
      });
    });

    this.element.querySelectorAll(".custom-reserva-field[data-custom-id]").forEach(input => {
      input.addEventListener("change", async e => {
        const id    = e.target.dataset.customId;
        const field = e.target.dataset.field;
        const reservasCustom = foundry.utils.deepClone(this.actor.system.reservasCustom ?? []);
        const r = reservasCustom.find(x => x.id === id);
        if (!r) return;
        r[field] = e.target.type === "number" ? (parseInt(e.target.value) || 1) : e.target.value;
        if (field === "total") r.atual = Math.min(r.atual, r[field]);
        await this.actor.update({ "system.reservasCustom": reservasCustom });
      });
    });
  }

  // ─── Fatos ─────────────────────────────────────────────────────

  static async #addFato() {
    const fatos = foundry.utils.deepClone(this.actor.system.fatos);
    fatos.push({ id: foundry.utils.randomID(), texto: "", rompido: false });
    await this.actor.update({ "system.fatos": fatos });
  }

  static async #removeFato(event, btn) {
    const id = btn.dataset.id;
    await this.actor.update({ "system.fatos": this.actor.system.fatos.filter(f => f.id !== id) });
  }

  static async #toggleRompido(event, btn) {
    const id    = btn.dataset.id;
    const fatos = foundry.utils.deepClone(this.actor.system.fatos);
    const fato  = fatos.find(f => f.id === id);
    if (fato) fato.rompido = !fato.rompido;
    await this.actor.update({ "system.fatos": fatos });
  }

  // ─── Reservas Custom ───────────────────────────────────────────

  static async #addCustomReserva() {
    const reservasCustom = foundry.utils.deepClone(this.actor.system.reservasCustom ?? []);
    reservasCustom.push({
      id: foundry.utils.randomID(), nome: "Reserva", atual: 3, total: 3,
      gatilho: "", consequencia: "", pinnado: false,
    });
    await this.actor.update({ "system.reservasCustom": reservasCustom });
  }

  static async #removeCustomReserva(event, btn) {
    const id = btn.dataset.customId;
    const reservasCustom = (this.actor.system.reservasCustom ?? []).filter(r => r.id !== id);
    await this.actor.update({ "system.reservasCustom": reservasCustom });
  }

  static async #decrementCustom(event, btn) {
    const id = btn.dataset.customId;
    const reservasCustom = foundry.utils.deepClone(this.actor.system.reservasCustom ?? []);
    const r = reservasCustom.find(x => x.id === id);
    if (r) r.atual = Math.max(0, r.atual - 1);
    await this.actor.update({ "system.reservasCustom": reservasCustom });
  }

  static async #incrementCustom(event, btn) {
    const id = btn.dataset.customId;
    const reservasCustom = foundry.utils.deepClone(this.actor.system.reservasCustom ?? []);
    const r = reservasCustom.find(x => x.id === id);
    if (r) r.atual = Math.min(r.total, r.atual + 1);
    await this.actor.update({ "system.reservasCustom": reservasCustom });
  }

  static async #togglePin(event, btn) {
    const id = btn.dataset.customId;
    const reservasCustom = foundry.utils.deepClone(this.actor.system.reservasCustom ?? []);
    const r = reservasCustom.find(x => x.id === id);
    if (r) r.pinnado = !r.pinnado;
    await this.actor.update({ "system.reservasCustom": reservasCustom });
  }
}
