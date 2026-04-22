import { applySheetAppearance } from "../helpers/appearance.mjs";

const { api, sheets } = foundry.applications;

export class FractalDesafioSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["fractal-rpg", "sheet", "actor", "desafio"],
    window:  { resizable: true },
    position: { width: 620, height: 720 },
    form: { submitOnChange: false },
    actions: {
      addFato:             FractalDesafioSheet.#addFato,
      removeFato:          FractalDesafioSheet.#removeFato,
      toggleRompido:       FractalDesafioSheet.#toggleRompido,
      decrementReserva:    FractalDesafioSheet.#decrementReserva,
      incrementReserva:    FractalDesafioSheet.#incrementReserva,
      addCustomReserva:    FractalDesafioSheet.#addCustomReserva,
      removeCustomReserva: FractalDesafioSheet.#removeCustomReserva,
      decrementCustom:     FractalDesafioSheet.#decrementCustom,
      incrementCustom:     FractalDesafioSheet.#incrementCustom,
      togglePin:           FractalDesafioSheet.#togglePin,
      togglePinWorld:      FractalDesafioSheet.#togglePinWorld,
    },
  };

  static PARTS = {
    body: { template: "systems/fractal-rpg/templates/actor/desafio-sheet.hbs" },
  };

  get title() { return this.document.name; }

  async _prepareContext(options) {
    const reservasDefs    = game.settings.get?.("fractal-rpg", "reservasDesafio") ?? [];
    const reservasPinnadas = new Set(this.actor.system.reservasPinnadas ?? []);
    const reservas = reservasDefs.map(def => {
      const vals    = this.actor.system.reservas[def.id] ?? { atual: def.valor_inicial, total: def.valor_inicial };
      const tracker = Array.from({ length: vals.total }, (_, i) => ({ filled: i < vals.atual }));
      return { ...def, ...vals, tracker, pinnada: reservasPinnadas.has(def.id) };
    });

    const reservasCustom = (this.actor.system.reservasCustom ?? []).map(r => ({
      ...r,
      tracker: Array.from({ length: r.total }, (_, i) => ({ filled: i < r.atual })),
    }));

    return {
      actor:         this.document,
      system:        this.document.system,
      editable:      this.isEditable,
      owner:         this.document.isOwner,
      reservas,
      reservasCustom,
      superado:      this.document.system.todosRompidos,
      isGM:          game.user?.isGM ?? false,
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);

    const sheet = this.element.querySelector(".fractal-sheet");
    if (sheet) applySheetAppearance(sheet, "desafio");

    // Campos name= — listeners manuais
    this.element.querySelector('input[name="name"]')?.addEventListener("change", async e => {
      await this.actor.update({ name: e.target.value });
    });
    this.element.querySelector('input[name="system.tipo"]')?.addEventListener("change", async e => {
      await this.actor.update({ "system.tipo": e.target.value });
    });
    this.element.querySelector('textarea[name="system.notas_arquiteto"]')?.addEventListener("change", async e => {
      await this.actor.update({ "system.notas_arquiteto": e.target.value });
    });

    // Total editável das reservas de template
    this.element.querySelectorAll(".reserva-total-input[data-reserva-id]").forEach(input => {
      input.addEventListener("change", async e => {
        const id        = e.target.dataset.reservaId;
        const novoTotal = Math.max(1, parseInt(e.target.value) || 1);
        const reservas  = foundry.utils.deepClone(this.actor.system.reservas);
        const def       = (game.settings.get?.("fractal-rpg", "reservasDesafio") ?? []).find(r => r.id === id);
        if (!reservas[id]) reservas[id] = { atual: def?.valor_inicial ?? 3, total: def?.valor_inicial ?? 3 };
        reservas[id].total = novoTotal;
        reservas[id].atual = Math.min(reservas[id].atual, novoTotal);
        await this.actor.update({ "system.reservas": reservas });
      });
    });

    // Salva texto dos fatos
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

    // Edição inline de reservas custom (nome, total, gatilho, consequencia)
    this.element.querySelectorAll(".custom-reserva-field[data-custom-id]").forEach(input => {
      input.addEventListener("change", async e => {
        const id    = e.target.dataset.customId;
        const field = e.target.dataset.field;
        const reservasCustom = foundry.utils.deepClone(this.actor.system.reservasCustom ?? []);
        const r = reservasCustom.find(x => x.id === id);
        if (!r) return;
        r[field] = e.target.type === "number" ? (parseInt(e.target.value) || 1) : e.target.value;
        // Se total mudou, ajusta atual para não exceder
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

  // ─── Reservas (world settings) ─────────────────────────────────

  static async #decrementReserva(event, btn) {
    const id       = btn.dataset.reservaId;
    const reservas = foundry.utils.deepClone(this.actor.system.reservas);
    if (!reservas[id]) {
      const def = (game.settings.get?.("fractal-rpg", "reservasDesafio") ?? []).find(r => r.id === id);
      if (!def) return;
      reservas[id] = { atual: def.valor_inicial, total: def.valor_inicial };
    }
    reservas[id].atual = Math.max(0, (reservas[id].atual ?? 0) - 1);
    await this.actor.update({ "system.reservas": reservas });
  }

  static async #incrementReserva(event, btn) {
    const id       = btn.dataset.reservaId;
    const reservas = foundry.utils.deepClone(this.actor.system.reservas);
    const def      = (game.settings.get?.("fractal-rpg", "reservasDesafio") ?? []).find(r => r.id === id);
    if (!reservas[id]) {
      if (!def) return;
      reservas[id] = { atual: def.valor_inicial, total: def.valor_inicial };
    }
    const max = reservas[id].total ?? (def?.valor_maximo_permitido ?? 6);
    reservas[id].atual = Math.min(max, (reservas[id].atual ?? 0) + 1);
    await this.actor.update({ "system.reservas": reservas });
  }

  // ─── Reservas Custom ───────────────────────────────────────────

  static async #addCustomReserva() {
    const reservasCustom = foundry.utils.deepClone(this.actor.system.reservasCustom ?? []);
    reservasCustom.push({ id: foundry.utils.randomID(), nome: "Reserva", atual: 3, total: 3, gatilho: "", consequencia: "", pinnado: false });
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

  static async #togglePinWorld(event, btn) {
    const id       = btn.dataset.reservaId;
    const pinnadas = foundry.utils.deepClone(this.actor.system.reservasPinnadas ?? []);
    const idx      = pinnadas.indexOf(id);
    if (idx >= 0) pinnadas.splice(idx, 1);
    else pinnadas.push(id);
    await this.actor.update({ "system.reservasPinnadas": pinnadas });
  }
}
