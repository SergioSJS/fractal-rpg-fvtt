import { openRollDialog } from "../helpers/roll-dialog.mjs";
import { openInterludeDialog } from "../helpers/interlude.mjs";
import { applySheetAppearance } from "../helpers/appearance.mjs";

const { api, sheets } = foundry.applications;

export class FractalActorSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["fractal-rpg", "sheet", "actor", "personagem"],
    window:  { resizable: true },
    position: { width: 680, height: 820 },
    form: { submitOnChange: false },
    actions: {
      addFato:          FractalActorSheet.#addFato,
      removeFato:       FractalActorSheet.#removeFato,
      toggleRompido:    FractalActorSheet.#toggleRompido,
      toggleSelecao:    FractalActorSheet.#toggleSelecao,
      openRollDialog:   FractalActorSheet.#openRollDialog,
      rollEsseFato:     FractalActorSheet.#rollEsseFato,
      openInterlude:    FractalActorSheet.#openInterlude,
      decrementReserva: FractalActorSheet.#decrementReserva,
      incrementReserva: FractalActorSheet.#incrementReserva,
    },
  };

  static PARTS = {
    body: { template: "systems/fractal-rpg/templates/actor/character-sheet.hbs" },
  };

  #selectedFatos = new Set();

  get title() { return this.document.name; }

  async _prepareContext(options) {
    const reservasDefs = game.settings.get?.("fractal-rpg", "reservasPersonagem") ?? [];
    const reservas = reservasDefs.map(def => {
      const vals    = this.actor.system.reservas[def.id] ?? { atual: def.valor_inicial, total: def.valor_inicial };
      const tracker = Array.from({ length: vals.total }, (_, i) => ({ filled: i < vals.atual, idx: i }));
      return { ...def, ...vals, tracker };
    });

    const fatos = this.actor.system.fatos.map(f => ({
      ...f,
      selected: this.#selectedFatos.has(f.id),
    }));

    return {
      actor:         this.document,
      system:        { ...this.document.system, fatos },
      editable:      this.isEditable,
      owner:         this.document.isOwner,
      reservas,
      selectedCount: this.#selectedFatos.size,
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);

    const sheet = this.element.querySelector(".fractal-sheet");
    if (sheet) applySheetAppearance(sheet, "personagem");

    // Campos name= não submetem via submitOnChange neste setup — listeners manuais
    this.element.querySelector('input[name="name"]')?.addEventListener("change", async e => {
      await this.actor.update({ name: e.target.value });
    });
    this.element.querySelector('input[name="system.xp.value"]')?.addEventListener("change", async e => {
      await this.actor.update({ "system.xp.value": Math.max(0, parseInt(e.target.value) || 0) });
    });
    this.element.querySelector('textarea[name="system.anotacoes"]')?.addEventListener("change", async e => {
      await this.actor.update({ "system.anotacoes": e.target.value });
    });

    // Salva texto dos fatos
    this.element.querySelectorAll(".fato-texto[data-fato-idx]").forEach(input => {
      input.addEventListener("change", async e => {
        const idx  = parseInt(e.target.dataset.fatoIdx);
        const fatos = foundry.utils.deepClone(this.actor.system.fatos);
        if (fatos[idx] !== undefined) {
          fatos[idx].texto = e.target.value;
          await this.actor.update({ "system.fatos": fatos });
        }
      });
    });

    // Edição inline do total de cada reserva
    this.element.querySelectorAll(".reserva-total-input[data-reserva-id]").forEach(input => {
      input.addEventListener("change", async e => {
        const id       = e.target.dataset.reservaId;
        const novoTotal = Math.max(1, parseInt(e.target.value) || 1);
        const reservas  = foundry.utils.deepClone(this.actor.system.reservas);
        const def       = (game.settings.get?.("fractal-rpg", "reservasPersonagem") ?? []).find(r => r.id === id);
        if (!reservas[id]) reservas[id] = { atual: def?.valor_inicial ?? 3, total: def?.valor_inicial ?? 3 };
        reservas[id].total = novoTotal;
        reservas[id].atual = Math.min(reservas[id].atual, novoTotal);
        await this.actor.update({ "system.reservas": reservas });
      });
    });
  }

  // ─── Fatos ─────────────────────────────────────────────────────

  static async #addFato() {
    const fatos = foundry.utils.deepClone(this.actor.system.fatos);
    fatos.push({ id: foundry.utils.randomID(), texto: "", rompido: false, predefinido: false });
    await this.actor.update({ "system.fatos": fatos });
  }

  // Foundry v13 ApplicationV2: segundo argumento é o elemento com data-action
  static async #removeFato(event, btn) {
    const id = btn.dataset.id;
    this.#selectedFatos.delete(id);
    await this.actor.update({ "system.fatos": this.actor.system.fatos.filter(f => f.id !== id) });
  }

  static async #toggleRompido(event, btn) {
    const id    = btn.dataset.id;
    const fatos = foundry.utils.deepClone(this.actor.system.fatos);
    const fato  = fatos.find(f => f.id === id);
    if (fato) {
      fato.rompido = !fato.rompido;
      if (fato.rompido) this.#selectedFatos.delete(id);
    }
    await this.actor.update({ "system.fatos": fatos });
  }

  static async #toggleSelecao(event, btn) {
    const id   = btn.dataset.id;
    const fato = this.actor.system.fatos.find(f => f.id === id);
    if (!fato || fato.rompido) return;
    if (this.#selectedFatos.has(id)) {
      this.#selectedFatos.delete(id);
    } else {
      if (this.#selectedFatos.size >= 3) {
        ui.notifications.warn("Máximo de 3 Fatos por rolagem.");
        return;
      }
      this.#selectedFatos.add(id);
    }
    this.render(false);
  }

  // ─── Rolagem ───────────────────────────────────────────────────

  static async #openRollDialog() {
    const ids = [...this.#selectedFatos];
    this.#selectedFatos.clear();
    this.render(false);
    openRollDialog(this.actor, ids);
  }

  static async #rollEsseFato(event, btn) {
    const id   = btn.dataset.id;
    const fato = this.actor.system.fatos.find(f => f.id === id);
    if (!fato || fato.rompido) return;
    openRollDialog(this.actor, [id]);
  }

  static async #openInterlude() {
    openInterludeDialog(this.actor);
  }

  // ─── Reservas ──────────────────────────────────────────────────

  static async #decrementReserva(event, btn) {
    const id       = btn.dataset.reservaId;
    const reservas = foundry.utils.deepClone(this.actor.system.reservas);
    if (!reservas[id]) {
      const def = (game.settings.get?.("fractal-rpg", "reservasPersonagem") ?? []).find(r => r.id === id);
      if (!def) return;
      reservas[id] = { atual: def.valor_inicial, total: def.valor_inicial };
    }
    reservas[id].atual = Math.max(0, (reservas[id].atual ?? 0) - 1);
    await this.actor.update({ "system.reservas": reservas });
  }

  static async #incrementReserva(event, btn) {
    const id       = btn.dataset.reservaId;
    const reservas = foundry.utils.deepClone(this.actor.system.reservas);
    const def      = (game.settings.get?.("fractal-rpg", "reservasPersonagem") ?? []).find(r => r.id === id);
    if (!reservas[id]) {
      if (!def) return;
      reservas[id] = { atual: def.valor_inicial, total: def.valor_inicial };
    }
    const max = reservas[id].total ?? (def?.valor_maximo_permitido ?? 6);
    reservas[id].atual = Math.min(max, (reservas[id].atual ?? 0) + 1);
    await this.actor.update({ "system.reservas": reservas });
  }
}
