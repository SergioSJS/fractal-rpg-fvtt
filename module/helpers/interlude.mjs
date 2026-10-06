const { DialogV2 } = foundry.applications.api;
const esc = foundry.utils.escapeHTML;
const t   = (key, data) => data ? game.i18n.format(key, data) : game.i18n.localize(key);

export function openInterludeDialog(actor) {
  const system   = actor.system;
  const reservas = (game.settings.get("fractal-rpg", "reservasPersonagem") ?? []).map(def => {
    const vals = system.reservas[def.id] ?? { atual: def.valor_inicial, total: def.valor_inicial };
    return { ...def, ...vals };
  });

  // Mesma lógica da ficha (FractalActorSheet#_prepareContext):
  // o dropdown de "Mudar" só lista predefinidos cujo tipo ainda existe nas configs
  // do GM (descarta órfãos de tipos removidos/renomeados), seguidos dos Fatos livres.
  // IMPORTANTE: usamos a lista crua (system.fatos) ao persistir mudanças para não
  // apagar do banco Fatos órfãos que ficam apenas escondidos da UI.
  const fatos        = system.fatos;
  const fatosDefs    = game.settings.get("fractal-rpg", "fatosPersonagem") ?? [];
  const predefinidos = fatosDefs
    .map(def => fatos.find(f => f.predefinido && f.tipo === def.tipo))
    .filter(Boolean);
  const livres       = fatos.filter(f => !f.predefinido);
  const fatosVisiveis = [...predefinidos, ...livres];

  const reservaOpts = (filtrar) =>
    reservas.filter(filtrar).map(r => `<option value="${r.id}">${esc(r.nome)} (${r.atual}/${r.total})</option>`).join("") ||
    `<option disabled>${t("FRACTAL.Interludio.NenhumaDisponivel")}</option>`;

  const fatoOpts = fatosVisiveis.map(f => {
    const label = f.texto || (f.tipo ? `(${f.tipo})` : t("FRACTAL.Comum.FatoSemNome"));
    return `<option value="${f.id}">${esc(label)}</option>`;
  }).join("") || `<option disabled>${t("FRACTAL.Interludio.NenhumFato")}</option>`;

  const maxReservaOpts = reservas.filter(r => r.total < (r.valor_maximo_permitido ?? 6));
  const gratis = t("FRACTAL.Interludio.Gratis");

  const content = `
<div class="fractal-interlude-dialog">
  <p class="interlude-hint">${t("FRACTAL.Interludio.Dica")}</p>

  <div class="acoes-lista">

    <div class="acao-item" data-acao="evoluir">
      <label class="acao-header">
        <input type="checkbox" name="acao" value="evoluir" />
        <span class="acao-nome">${t("FRACTAL.Interludio.Evoluir")}</span>
        <span class="acao-custo custo-xp">3 XP</span>
        <span class="acao-desc">${t("FRACTAL.Interludio.EvoluirDesc")}</span>
      </label>
      <div class="acao-config" hidden>
        <input type="text" name="evoluir_texto" placeholder="${t("FRACTAL.Interludio.EvoluirPh")}" />
      </div>
    </div>

    <div class="acao-item" data-acao="aprimorar">
      <label class="acao-header">
        <input type="checkbox" name="acao" value="aprimorar" ${maxReservaOpts.length === 0 ? "disabled" : ""}/>
        <span class="acao-nome">${t("FRACTAL.Interludio.Aprimorar")}</span>
        <span class="acao-custo custo-xp">3 XP</span>
        <span class="acao-desc">${t("FRACTAL.Interludio.AprimorarDesc")}</span>
      </label>
      <div class="acao-config" hidden>
        <select name="aprimorar_reserva">
          ${maxReservaOpts.map(r => `<option value="${r.id}">${esc(r.nome)} (${r.atual}/${r.total} ${t("FRACTAL.Interludio.OpcaoMax", { max: r.valor_maximo_permitido ?? 6 })})</option>`).join("") || `<option disabled>${t("FRACTAL.Interludio.TodasNoMaximo")}</option>`}
        </select>
      </div>
    </div>

    <div class="acao-item" data-acao="descansar">
      <label class="acao-header">
        <input type="checkbox" name="acao" value="descansar" />
        <span class="acao-nome">${t("FRACTAL.Interludio.Descansar")}</span>
        <span class="acao-custo custo-gratis">${gratis}</span>
        <span class="acao-desc">${t("FRACTAL.Interludio.DescansarDesc")}</span>
      </label>
      <div class="acao-config" hidden>
        <select name="descansar_reserva">${reservaOpts(() => true)}</select>
      </div>
    </div>

    <div class="acao-item" data-acao="mudar">
      <label class="acao-header">
        <input type="checkbox" name="acao" value="mudar" ${fatosVisiveis.length === 0 ? "disabled" : ""}/>
        <span class="acao-nome">${t("FRACTAL.Interludio.Mudar")}</span>
        <span class="acao-custo custo-gratis">${gratis}</span>
        <span class="acao-desc">${t("FRACTAL.Interludio.MudarDesc")}</span>
      </label>
      <div class="acao-config" hidden>
        <select name="mudar_fato_id">${fatoOpts}</select>
        <input type="text" name="mudar_fato_texto" placeholder="${t("FRACTAL.Interludio.MudarPh")}" />
      </div>
    </div>

    <div class="acao-item" data-acao="preparar">
      <label class="acao-header">
        <input type="checkbox" name="acao" value="preparar" />
        <span class="acao-nome">${t("FRACTAL.Interludio.Preparar")}</span>
        <span class="acao-custo custo-gratis">${gratis}</span>
        <span class="acao-desc">${t("FRACTAL.Interludio.PrepararDesc")}</span>
      </label>
    </div>

  </div>

  <div class="xp-atual">${t("FRACTAL.Interludio.XPAtual")} <strong id="xp-display">${system.xp.value}</strong></div>
</div>`;

  DialogV2.wait({
    classes:     ["fractal-rpg"],
    window:      { title: "FRACTAL.Interludio.Titulo" },
    position:    { width: 480 },
    content,
    rejectClose: false,
    render: (_ev, app) => {
      const el = app.element;
      const indisponiveis = new Set(el.querySelectorAll('input[name="acao"]:disabled'));
      el.querySelectorAll('input[name="acao"]').forEach(cb => {
        cb.addEventListener("change", () => {
          const acao   = cb.value;
          const config = el.querySelector(`.acao-item[data-acao="${acao}"] .acao-config`);
          if (config) config.hidden = !cb.checked;

          const total = el.querySelectorAll('input[name="acao"]:checked').length;
          el.querySelectorAll('input[name="acao"]:not(:checked)').forEach(i => {
            if (!indisponiveis.has(i)) i.disabled = total >= 2;
          });
          el.querySelectorAll('input[name="acao"]:checked').forEach(i => { i.disabled = false; });
        });
      });
    },
    buttons: [
      {
        action:   "confirmar",
        label:    "FRACTAL.Interludio.Confirmar",
        icon:     "fas fa-moon",
        default:  true,
        callback: async (_ev, _btn, dialog) => {
          await _executarInterlude(actor, dialog.element, reservas, fatos);
        },
      },
      {
        action: "cancelar",
        label:  "FRACTAL.Comum.Cancelar",
      },
    ],
  });
}

async function _executarInterlude(actor, el, reservas, fatos) {
  const acoes    = [...el.querySelectorAll('input[name="acao"]:checked')].map(i => i.value);
  const system   = actor.system;
  const updates  = {};
  const mensagens = [];

  const fatosRestaurados = foundry.utils.deepClone(fatos).map(f => ({ ...f, rompido: false }));
  updates["system.fatos"] = fatosRestaurados;
  if (fatos.some(f => f.rompido)) mensagens.push(t("FRACTAL.Interludio.MsgRestaurados"));

  let novoXP = system.xp.value;

  for (const acao of acoes) {
    if (acao === "evoluir") {
      const texto = el.querySelector('input[name="evoluir_texto"]')?.value?.trim() ?? "";
      if (novoXP < 3) { ui.notifications.warn(t("FRACTAL.Interludio.AvisoXPEvoluir")); continue; }
      if (!texto)     { ui.notifications.warn(t("FRACTAL.Interludio.AvisoTextoEvoluir")); continue; }
      novoXP -= 3;
      const fatos2 = updates["system.fatos"] ?? foundry.utils.deepClone(fatos);
      fatos2.push({ id: foundry.utils.randomID(), texto, rompido: false, predefinido: false });
      updates["system.fatos"] = fatos2;
      mensagens.push(t("FRACTAL.Interludio.MsgEvoluiu", { texto: esc(texto) }));
    }

    if (acao === "aprimorar") {
      const reservaId = el.querySelector('select[name="aprimorar_reserva"]')?.value ?? "";
      if (novoXP < 3) { ui.notifications.warn(t("FRACTAL.Interludio.AvisoXPAprimorar")); continue; }
      const def = reservas.find(r => r.id === reservaId);
      if (!def) continue;
      const max = def.valor_maximo_permitido ?? 6;
      if (def.total >= max) { ui.notifications.warn(t("FRACTAL.Interludio.AvisoNoMaximo", { nome: def.nome, max })); continue; }
      novoXP -= 3;
      const reservasCopy = foundry.utils.deepClone(system.reservas);
      if (!reservasCopy[reservaId]) reservasCopy[reservaId] = { atual: def.valor_inicial, total: def.valor_inicial };
      reservasCopy[reservaId].total = Math.min(max, reservasCopy[reservaId].total + 1);
      updates["system.reservas"] = reservasCopy;
      mensagens.push(t("FRACTAL.Interludio.MsgAprimorou", { nome: esc(def.nome), de: def.total, para: def.total + 1 }));
    }

    if (acao === "descansar") {
      const reservaId    = el.querySelector('select[name="descansar_reserva"]')?.value ?? "";
      const def          = reservas.find(r => r.id === reservaId);
      if (!def) continue;
      const reservasCopy = updates["system.reservas"] ?? foundry.utils.deepClone(system.reservas);
      if (!reservasCopy[reservaId]) reservasCopy[reservaId] = { atual: def.valor_inicial, total: def.valor_inicial };
      const anterior = reservasCopy[reservaId].atual;
      reservasCopy[reservaId].atual = Math.min(reservasCopy[reservaId].total, anterior + 1);
      updates["system.reservas"] = reservasCopy;
      mensagens.push(t("FRACTAL.Interludio.MsgDescansou", { nome: esc(def.nome), de: anterior, para: reservasCopy[reservaId].atual }));
    }

    if (acao === "mudar") {
      const id        = el.querySelector('select[name="mudar_fato_id"]')?.value ?? "";
      const novoTexto = el.querySelector('input[name="mudar_fato_texto"]')?.value?.trim() ?? "";
      if (!novoTexto) { ui.notifications.warn(t("FRACTAL.Interludio.AvisoTextoMudar")); continue; }
      const fatos2 = updates["system.fatos"] ?? foundry.utils.deepClone(fatos);
      const fato   = fatos2.find(f => f.id === id);
      if (fato) {
        const anterior = fato.texto;
        fato.texto = novoTexto;
        updates["system.fatos"] = fatos2;
        mensagens.push(t("FRACTAL.Interludio.MsgMudou", { de: esc(anterior || "?"), para: esc(novoTexto) }));
      }
    }

    if (acao === "preparar") {
      novoXP += 1;
      mensagens.push(t("FRACTAL.Interludio.MsgPreparou"));
    }
  }

  updates["system.xp.value"] = novoXP;
  await actor.update(updates);

  const titulo = t("FRACTAL.Interludio.Resumo", { nome: esc(actor.name) });
  const corpo  = mensagens.length ? mensagens.join("<br>") : t("FRACTAL.Interludio.SemAcoes");
  const resumo = `<b>${titulo}</b><br>${corpo}`;

  await ChatMessage.create({ content: resumo, speaker: ChatMessage.getSpeaker({ actor }) });
}
