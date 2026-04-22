import { applySheetAppearance } from "../helpers/appearance.mjs";

const { api, sheets } = foundry.applications;

export class FractalGrupoSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["fractal-rpg", "sheet", "actor", "grupo"],
    window:  { resizable: true },
    position: { width: 620, height: 720 },
    form: { submitOnChange: false },
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

    const fatosDefs  = game.settings.get?.("fractal-rpg", "fatosGrupo") ?? [];
    const actorFatos = this.actor.system.fatos;

    const predefinidos = fatosDefs.map(def => {
      const existing = actorFatos.find(f => f.predefinido && f.tipo === def.tipo);
      return existing
        ? { ...existing, tipoLabel: def.tipo, obrigatorio: def.obrigatorio }
        : { id: null, texto: "", rompido: false, predefinido: true, tipo: def.tipo, tipoLabel: def.tipo, obrigatorio: def.obrigatorio };
    });

    const fatos = [...predefinidos, ...actorFatos.filter(f => !f.predefinido)];

    return {
      actor:         this.document,
      system:        this.document.system,
      fatos,
      editable:      this.isEditable,
      owner:         this.document.isOwner,
      isGM:          game.user?.isGM ?? false,
      reservasCustom,
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);

    const sheet = this.element.querySelector(".fractal-sheet");
    if (sheet) applySheetAppearance(sheet, "grupo");

    // Avatar click
    if (this.isEditable) {
      this.element.querySelector(".actor-img")?.addEventListener("click", () => {
        new foundry.applications.apps.FilePicker.implementation({ type: "image", current: this.actor.img,
          callback: async path => { await this.actor.update({ img: path }); },
        }).browse();
      });
    }

    // Campos name= — listeners manuais
    this.element.querySelector('input[name="name"]')?.addEventListener("change", async e => {
      await this.actor.update({ name: e.target.value });
    });
    this.element.querySelector('input[name="system.descricao"]')?.addEventListener("change", async e => {
      await this.actor.update({ "system.descricao": e.target.value });
    });
    this.element.querySelector('textarea[name="system.notas"]')?.addEventListener("change", async e => {
      await this.actor.update({ "system.notas": e.target.value });
    });

    // Salva texto dos fatos (predefinidos por tipo, livres por id)
    this.element.querySelectorAll(".fato-texto").forEach(input => {
      input.addEventListener("change", async e => {
        const tipo   = e.target.dataset.predefinidoTipo;
        const fatoId = e.target.dataset.fatoId;
        const fatos  = foundry.utils.deepClone(this.actor.system.fatos);
        if (tipo) {
          const existing = fatos.find(f => f.predefinido && f.tipo === tipo);
          if (existing) {
            existing.texto = e.target.value;
          } else {
            fatos.push({ id: foundry.utils.randomID(), texto: e.target.value, rompido: false, predefinido: true, tipo });
          }
        } else if (fatoId) {
          const fato = fatos.find(f => f.id === fatoId);
          if (fato) fato.texto = e.target.value;
        }
        await this.actor.update({ "system.fatos": fatos });
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
