const TEMPLATE = "systems/fractal-rpg/templates/hud/clock-panel.hbs";

class FractalClockPanel {
  #el              = null;
  #listenerBound   = false;

  async render() {
    if (!game.actors) return;

    const clocks = [];
    for (const actor of game.actors) {
      if (!["desafio", "grupo"].includes(actor.type)) continue;

      const accentKey   = actor.type === "grupo" ? "corAccentGrupo" : "corAccentDesafio";
      const accentColor = game.settings.get?.("fractal-rpg", accentKey) ?? "#8B0000";

      // World reservas — desafio only
      if (actor.type === "desafio") {
        const defs     = game.settings.get?.("fractal-rpg", "reservasDesafio") ?? [];
        const pinnadas = new Set(actor.system.reservasPinnadas ?? []);
        for (const def of defs) {
          if (!pinnadas.has(def.id)) continue;
          const vals = actor.system.reservas?.[def.id] ?? { atual: def.valor_inicial ?? 0, total: def.valor_maximo_permitido ?? 6 };
          clocks.push({
            actorId:     actor.id,
            actorName:   actor.name,
            reservaId:   def.id,
            reservaType: "world",
            nome:        def.nome || "Reserva",
            atual:       vals.atual ?? 0,
            total:       vals.total ?? def.valor_maximo_permitido ?? 6,
            gatilho:     def.gatilho || "",
            accentColor,
          });
        }
      }

      // Custom reservas — desafio + grupo
      for (const r of actor.system.reservasCustom ?? []) {
        if (!r.pinnado) continue;
        clocks.push({
          actorId:     actor.id,
          actorName:   actor.name,
          reservaId:   r.id,
          reservaType: "custom",
          nome:        r.nome || "Reserva",
          atual:       r.atual,
          total:       r.total,
          gatilho:     r.gatilho || "",
          accentColor,
        });
      }
    }

    const isGM = game.user?.isGM ?? false;
    const html = await foundry.applications.handlebars.renderTemplate(TEMPLATE, { clocks, isGM });

    if (!this.#el) {
      this.#el = document.createElement("div");
      this.#el.id = "fractal-clock-panel";
      const target = document.querySelector("#ui-right-column-1") ?? document.body;
      target.prepend(this.#el);
    }

    this.#el.innerHTML     = html;
    this.#el.style.display = clocks.length ? "block" : "none";

    // Attach the delegated listener only once — it survives innerHTML replacements
    // because it lives on this.#el which is never destroyed
    if (!this.#listenerBound) {
      this.#listenerBound = true;
      this.#el.addEventListener("click", e => this.#onClick(e));
    }
  }

  async #onClick(e) {
    const btn = e.target.closest("[data-clock-action]");
    if (!btn) return;
    e.stopPropagation();

    const action = btn.dataset.clockAction;
    const entry  = btn.closest(".fractal-clock-entry");
    if (!entry) return;

    const { actorId, reservaId, reservaType } = entry.dataset;
    const actor = game.actors.get(actorId);
    if (!actor) return;

    if (action === "unpin" && !(game.user?.isGM)) return;

    if (action === "unpin") {
      if (reservaType === "world") {
        const pinnadas = (actor.system.reservasPinnadas ?? []).filter(x => x !== reservaId);
        await actor.update({ "system.reservasPinnadas": pinnadas });
      } else {
        const rc = foundry.utils.deepClone(actor.system.reservasCustom ?? []);
        const r  = rc.find(x => x.id === reservaId);
        if (r) r.pinnado = false;
        await actor.update({ "system.reservasCustom": rc });
      }
      return;
    }

    if (reservaType === "world") {
      const reservas = foundry.utils.deepClone(actor.system.reservas ?? {});
      const def      = (game.settings.get?.("fractal-rpg", "reservasDesafio") ?? []).find(d => d.id === reservaId);
      if (!reservas[reservaId]) {
        if (!def) return;
        reservas[reservaId] = { atual: def.valor_inicial ?? 0, total: def.valor_maximo_permitido ?? 6 };
      }
      if (action === "dec") {
        reservas[reservaId].atual = Math.max(0, (reservas[reservaId].atual ?? 0) - 1);
      } else if (action === "inc") {
        const max = reservas[reservaId].total ?? (def?.valor_maximo_permitido ?? 6);
        reservas[reservaId].atual = Math.min(max, (reservas[reservaId].atual ?? 0) + 1);
      }
      await actor.update({ "system.reservas": reservas });
    } else {
      const rc = foundry.utils.deepClone(actor.system.reservasCustom ?? []);
      const r  = rc.find(x => x.id === reservaId);
      if (!r) return;
      if (action === "dec") r.atual = Math.max(0, r.atual - 1);
      else if (action === "inc") r.atual = Math.min(r.total, r.atual + 1);
      await actor.update({ "system.reservasCustom": rc });
    }
  }
}

export const clockPanel = new FractalClockPanel();
