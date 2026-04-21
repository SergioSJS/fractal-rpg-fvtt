const { api } = foundry.applications;

const DEFAULT_CSS = `/* ═══════════════════════════════════════════════
   Fractal RPG — Variáveis de Aparência
   Edite os valores abaixo para personalizar o sistema.
   ═══════════════════════════════════════════════ */
:root {
  --f-accent:       #8B0000;  /* cor principal (bordas, títulos, botões) */
  --f-accent2:      #a00000;  /* variante hover */
  --f-bg:           #f5f2ec;  /* fundo das fichas */
  --f-bg-section:   #eeeae2;  /* fundo das seções (reservas) */
  --f-bg-input:     #ffffff;  /* fundo dos inputs */
  --f-border:       #c8c0b0;  /* cor das bordas */
  --f-border-light: #ddd8cc;  /* bordas mais suaves */
  --f-green:        #1b5e20;  /* reservas cheias, sucesso */
  --f-red-roll:     #b71c1c;  /* falha, fatos rompidos */
  --f-orange:       #e65100;  /* impulso */
  --f-purple:       #6a1b9a;  /* ruptura */
  --f-blue:         #1565c0;  /* fatos selecionados */
}

/* Exemplo: tema horror
:root {
  --f-accent:     #2d0a0a;
  --f-accent2:    #4a0e0e;
  --f-bg:         #1a1a1a;
  --f-bg-section: #242424;
  --f-bg-input:   #2a2a2a;
  --f-border:     #444;
  --f-text:       #e0d0d0;
}
*/`;

const PRESETS = {
  fantasia: [
    { nome: "Vida",    valor_inicial: 3, valor_maximo_permitido: 6, gatilho: "Sofrer ferimentos",  consequencia: "Incapacitado" },
    { nome: "Vontade", valor_inicial: 3, valor_maximo_permitido: 6, gatilho: "Usar magia",         consequencia: "Exaustão Mágica" },
  ],
  scifi: [
    { nome: "Integridade", valor_inicial: 3, valor_maximo_permitido: 6, gatilho: "Dano físico",  consequencia: "Sistema Crítico" },
    { nome: "Energia",     valor_inicial: 3, valor_maximo_permitido: 6, gatilho: "Usar poderes", consequencia: "Apagão" },
  ],
  horror: [
    { nome: "Vida",      valor_inicial: 3, valor_maximo_permitido: 6, gatilho: "Ferimentos",         consequencia: "Morte" },
    { nome: "Sanidade",  valor_inicial: 3, valor_maximo_permitido: 6, gatilho: "Ver o além",         consequencia: "Enlouquecer" },
    { nome: "Esperança", valor_inicial: 2, valor_maximo_permitido: 4, gatilho: "Situações extremas", consequencia: "Desespero Total" },
  ],
  generico: [
    { nome: "Vida",    valor_inicial: 3, valor_maximo_permitido: 6, gatilho: "", consequencia: "" },
    { nome: "Vontade", valor_inicial: 3, valor_maximo_permitido: 6, gatilho: "", consequencia: "" },
  ],
};

export class ReservasConfigApp extends api.HandlebarsApplicationMixin(api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id:       "fractal-reservas-config",
    window:   { title: "Fractal RPG — Configurações", resizable: true },
    position: { width: 940, height: 600 },
    actions: {
      addReserva:    ReservasConfigApp._addReserva,
      removeReserva: ReservasConfigApp._removeReserva,
      switchTab:     ReservasConfigApp._switchTab,
      saveConfig:    ReservasConfigApp._saveConfig,
      closeConfig:   ReservasConfigApp._closeConfig,
      loadDefaultCss: ReservasConfigApp._loadDefaultCss,
    },
  };

  static PARTS = {
    body: { template: "systems/fractal-rpg/templates/settings/reservas-config.hbs" },
  };

  #tabIdx = 0;

  async _prepareContext() {
    const rawAccent = game.settings.get("fractal-rpg", "corAccent") ?? "#8B0000";
    const corAccent = /^#[0-9a-fA-F]{6}$/.test(rawAccent) ? rawAccent : "#8B0000";
    return {
      reservasPersonagem:      foundry.utils.deepClone(game.settings.get("fractal-rpg", "reservasPersonagem") ?? []),
      reservasDesafio:         foundry.utils.deepClone(game.settings.get("fractal-rpg", "reservasDesafio")    ?? []),
      backgroundPersonagem:    game.settings.get("fractal-rpg", "backgroundPersonagem")    ?? "",
      backgroundDesafio:       game.settings.get("fractal-rpg", "backgroundDesafio")       ?? "",
      bgOpacidadePersonagem:   game.settings.get("fractal-rpg", "bgOpacidadePersonagem")   ?? 0.25,
      bgOpacidadeDesafio:      game.settings.get("fractal-rpg", "bgOpacidadeDesafio")      ?? 0.25,
      corAccent,
      cssCustomizado:          game.settings.get("fractal-rpg", "cssCustomizado")           ?? "",
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);

    // Tab switching: índice por posição DOM, não depende de data-attributes
    this._showTab(this.#tabIdx);

    // Preset dropdowns
    this.element.querySelectorAll("select.preset-select").forEach(sel => {
      sel.addEventListener("change", e => {
        const key    = e.target.value;
        const target = e.target.dataset.target;
        if (!key || !PRESETS[key]) return;
        this._fillPreset(target, PRESETS[key]);
        e.target.value = "";
      });
    });

    // Sync color picker ↔ text
    const picker = this.element.querySelector("#cor-picker");
    const text   = this.element.querySelector("#cor-text");
    picker?.addEventListener("input", e => { if (text) text.value = e.target.value; });
    text?.addEventListener("input",   e => {
      if (/^#[0-9a-fA-F]{6}$/.test(e.target.value) && picker) picker.value = e.target.value;
    });

    // Sync opacity sliders ↔ value labels
    this.element.querySelectorAll(".opacity-slider").forEach(slider => {
      const val = slider.closest(".opacity-row")?.querySelector(".opacity-val");
      slider.addEventListener("input", e => { if (val) val.textContent = parseFloat(e.target.value).toFixed(2); });
    });
  }

  _showTab(idx) {
    const btns   = this.element.querySelectorAll(".cfg-tab-btn");
    const bodies = this.element.querySelectorAll(".cfg-tab-body");
    btns.forEach((b, i)   => b.classList.toggle("tab-active", i === idx));
    bodies.forEach((t, i) => { t.style.setProperty("display", i === idx ? "flex" : "none", "important"); });
  }

  _fillPreset(target, reservas) {
    const list = this.element.querySelector(`.reservas-list[data-target="${target}"]`);
    if (!list) return;
    list.innerHTML = "";
    reservas.forEach((r, idx) => list.insertAdjacentHTML("beforeend", _rowHtml(target, idx, r)));
  }

  // ─── Actions ───────────────────────────────────────────────────

  static _switchTab(event) {
    const idx = parseInt(event.currentTarget.dataset.tabIdx ?? event.target.closest("[data-tab-idx]")?.dataset.tabIdx ?? "-1");
    if (!Number.isFinite(idx) || idx < 0) return;
    this.#tabIdx = idx;
    this._showTab(idx);
  }

  static _closeConfig() {
    this.close();
  }

  static _loadDefaultCss() {
    const area = this.element.querySelector('[data-field="css"]');
    if (area) area.value = DEFAULT_CSS;
  }

  static _addReserva(event, btn) {
    const target = btn.dataset.target;
    const list   = this.element.querySelector(`.reservas-list[data-target="${target}"]`);
    if (!list) return;
    const idx    = list.querySelectorAll(".reserva-row").length;
    list.insertAdjacentHTML("beforeend", _rowHtml(target, idx, {
      nome: "", valor_inicial: 3, valor_maximo_permitido: 6, gatilho: "", consequencia: "",
    }));
    list.querySelector(".reserva-row:last-child .col-nome")?.focus();
  }

  static _removeReserva(event, btn) {
    btn.closest(".reserva-row")?.remove();
  }

  static async _saveConfig() {
    const el = this.element;

    const readReservas = (target) => {
      const rows = el.querySelectorAll(`.reservas-list[data-target="${target}"] .reserva-row`);
      return Array.from(rows).map(row => ({
        id:                     row.querySelector('[data-field="id"]')?.value     || foundry.utils.randomID(),
        nome:                   row.querySelector('[data-field="nome"]')?.value?.trim()          ?? "",
        valor_inicial:          Number(row.querySelector('[data-field="vinicial"]')?.value)       || 3,
        valor_maximo_permitido: Number(row.querySelector('[data-field="vmax"]')?.value)           || 6,
        gatilho:                row.querySelector('[data-field="gatilho"]')?.value?.trim()        ?? "",
        consequencia:           row.querySelector('[data-field="consequencia"]')?.value?.trim()   ?? "",
      })).filter(r => r.nome !== "");
    };

    const cor    = el.querySelector("#cor-text")?.value?.trim() || "#8B0000";
    const bgP    = el.querySelector('[data-field="bgPersonagem"]')?.value?.trim()          ?? "";
    const bgD    = el.querySelector('[data-field="bgDesafio"]')?.value?.trim()             ?? "";
    const opacP  = parseFloat(el.querySelector('[data-field="bgOpacidadePersonagem"]')?.value) || 0.25;
    const opacD  = parseFloat(el.querySelector('[data-field="bgOpacidadeDesafio"]')?.value)    || 0.25;
    const css    = el.querySelector('[data-field="css"]')?.value                           ?? "";

    await game.settings.set("fractal-rpg", "reservasPersonagem",      readReservas("reservasPersonagem"));
    await game.settings.set("fractal-rpg", "reservasDesafio",         readReservas("reservasDesafio"));
    await game.settings.set("fractal-rpg", "corAccent",                cor);
    await game.settings.set("fractal-rpg", "backgroundPersonagem",     bgP);
    await game.settings.set("fractal-rpg", "backgroundDesafio",        bgD);
    await game.settings.set("fractal-rpg", "bgOpacidadePersonagem",    opacP);
    await game.settings.set("fractal-rpg", "bgOpacidadeDesafio",       opacD);
    await game.settings.set("fractal-rpg", "cssCustomizado",           css);

    ui.notifications.info("Configurações do Fractal RPG salvas.");
    this.close();
  }
}

function _rowHtml(target, idx, r) {
  const id  = r.id || "";
  const esc = (v) => String(v ?? "").replace(/"/g, "&quot;");
  return `<div class="reserva-row">
    <input type="hidden" data-field="id"          value="${esc(id)}" />
    <input type="text"   data-field="nome"         value="${esc(r.nome)}"                  placeholder="Nome"         class="col-nome" />
    <input type="number" data-field="vinicial"     value="${r.valor_inicial ?? 3}"          min="1" max="6"            class="col-num"  />
    <input type="number" data-field="vmax"         value="${r.valor_maximo_permitido ?? 6}" min="1" max="10"           class="col-num"  />
    <input type="text"   data-field="gatilho"      value="${esc(r.gatilho)}"               placeholder="Gatilho"      class="col-texto"/>
    <input type="text"   data-field="consequencia" value="${esc(r.consequencia)}"           placeholder="Consequência" class="col-texto"/>
    <button type="button" class="btn-remove-row" data-action="removeReserva" title="Remover">×</button>
  </div>`;
}
