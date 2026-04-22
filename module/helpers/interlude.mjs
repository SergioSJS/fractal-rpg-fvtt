const { DialogV2 } = foundry.applications.api;

export function openInterludeDialog(actor) {
  const system   = actor.system;
  const reservas = (game.settings.get("fractal-rpg", "reservasPersonagem") ?? []).map(def => {
    const vals = system.reservas[def.id] ?? { atual: def.valor_inicial, total: def.valor_inicial };
    return { ...def, ...vals };
  });
  const fatos = system.fatos;

  const reservaOpts = (filtrar) =>
    reservas.filter(filtrar).map(r => `<option value="${r.id}">${r.nome} (${r.atual}/${r.total})</option>`).join("") ||
    '<option disabled>Nenhuma disponível</option>';

  const fatoOpts = fatos.map((f, i) =>
    `<option value="${i}">${f.texto || "(Fato " + (i + 1) + ")"}</option>`
  ).join("") || '<option disabled>Nenhum Fato</option>';

  const maxReservaOpts = reservas.filter(r => r.total < (r.valor_maximo_permitido ?? 6));

  const content = `
<div class="fractal-interlude-dialog">
  <p class="interlude-hint">Escolha até <strong>2 ações</strong>. Ao confirmar, todos os Fatos rompidos serão restaurados.</p>

  <div class="acoes-lista">

    <div class="acao-item" data-acao="evoluir">
      <label class="acao-header">
        <input type="checkbox" name="acao" value="evoluir" />
        <span class="acao-nome">Evoluir</span>
        <span class="acao-custo custo-xp">3 XP</span>
        <span class="acao-desc">Escrever novo Fato</span>
      </label>
      <div class="acao-config" style="display:none">
        <input type="text" name="evoluir_texto" placeholder="Texto do novo Fato..." style="width:100%"/>
      </div>
    </div>

    <div class="acao-item" data-acao="aprimorar">
      <label class="acao-header">
        <input type="checkbox" name="acao" value="aprimorar" ${maxReservaOpts.length === 0 ? "disabled" : ""}/>
        <span class="acao-nome">Aprimorar</span>
        <span class="acao-custo custo-xp">3 XP</span>
        <span class="acao-desc">+1 ao total de uma Reserva</span>
      </label>
      <div class="acao-config" style="display:none">
        <select name="aprimorar_reserva">
          ${maxReservaOpts.map(r => `<option value="${r.id}">${r.nome} (${r.atual}/${r.total} → máx ${r.valor_maximo_permitido ?? 6})</option>`).join("") || '<option disabled>Todas no máximo</option>'}
        </select>
      </div>
    </div>

    <div class="acao-item" data-acao="descansar">
      <label class="acao-header">
        <input type="checkbox" name="acao" value="descansar" />
        <span class="acao-nome">Descansar</span>
        <span class="acao-custo custo-gratis">Grátis</span>
        <span class="acao-desc">Recuperar 1 ponto de Reserva</span>
      </label>
      <div class="acao-config" style="display:none">
        <select name="descansar_reserva">${reservaOpts(() => true)}</select>
      </div>
    </div>

    <div class="acao-item" data-acao="mudar">
      <label class="acao-header">
        <input type="checkbox" name="acao" value="mudar" ${fatos.length === 0 ? "disabled" : ""}/>
        <span class="acao-nome">Mudar</span>
        <span class="acao-custo custo-gratis">Grátis</span>
        <span class="acao-desc">Reescrever um Fato existente</span>
      </label>
      <div class="acao-config" style="display:none">
        <select name="mudar_fato_idx">${fatoOpts}</select>
        <input type="text" name="mudar_fato_texto" placeholder="Novo texto do Fato..." style="width:100%;margin-top:4px"/>
      </div>
    </div>

    <div class="acao-item" data-acao="preparar">
      <label class="acao-header">
        <input type="checkbox" name="acao" value="preparar" />
        <span class="acao-nome">Preparar-se</span>
        <span class="acao-custo custo-gratis">Grátis</span>
        <span class="acao-desc">+1 XP</span>
      </label>
    </div>

  </div>

  <div class="xp-atual">XP atual: <strong id="xp-display">${system.xp.value}</strong></div>
</div>

<style>
.fractal-interlude-dialog { display:flex; flex-direction:column; gap:8px; padding:4px; font-size:13px; }
.interlude-hint { font-size:11px; color:#666; font-style:italic; margin:0; }
.acoes-lista { display:flex; flex-direction:column; gap:4px; }
.acao-item { border:1px solid #ddd; border-radius:4px; padding:6px 8px; }
.acao-item:has(input:checked) { border-color:#8B0000; background:rgba(139,0,0,0.04); }
.acao-header { display:flex; align-items:center; gap:8px; cursor:pointer; }
.acao-nome { font-weight:bold; }
.acao-custo { font-size:10px; padding:1px 5px; border-radius:8px; white-space:nowrap; }
.custo-xp    { background:#fee; color:#c0392b; border:1px solid #fcc; }
.custo-gratis { background:#efe; color:#27ae60; border:1px solid #cec; }
.acao-desc { font-size:11px; color:#888; }
.acao-config { margin-top:6px; }
.acao-config select,
.acao-config input[type=text] { width:100%; padding:3px 5px; border:1px solid #ccc; border-radius:3px; font-size:12px; }
.xp-atual { font-size:11px; color:#888; text-align:right; }
</style>`;

  DialogV2.wait({
    window:      { title: "Interlúdio" },
    position:    { width: 480 },
    content,
    rejectClose: false,
    render: (_ev, app) => {
      const el = app.element;
      el.querySelectorAll('input[name="acao"]').forEach(cb => {
        cb.addEventListener("change", () => {
          const acao   = cb.value;
          const config = el.querySelector(`.acao-item[data-acao="${acao}"] .acao-config`);
          if (config) config.style.display = cb.checked ? "block" : "none";

          const total = el.querySelectorAll('input[name="acao"]:checked').length;
          el.querySelectorAll('input[name="acao"]:not(:checked)').forEach(i => { i.disabled = total >= 2; });
          el.querySelectorAll('input[name="acao"]:checked').forEach(i => { i.disabled = false; });
        });
      });
    },
    buttons: [
      {
        action:   "confirmar",
        label:    "Confirmar Interlúdio",
        icon:     "fas fa-moon",
        default:  true,
        callback: async (_ev, _btn, dialog) => {
          await _executarInterlude(actor, dialog.element, reservas, fatos);
        },
      },
      {
        action: "cancelar",
        label:  "Cancelar",
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
  if (fatos.some(f => f.rompido)) mensagens.push("🔄 Todos os Fatos rompidos foram restaurados.");

  let novoXP = system.xp.value;

  for (const acao of acoes) {
    if (acao === "evoluir") {
      const texto = el.querySelector('input[name="evoluir_texto"]')?.value?.trim() ?? "";
      if (novoXP < 3) { ui.notifications.warn("XP insuficiente para Evoluir (custo: 3 XP)."); continue; }
      if (!texto)     { ui.notifications.warn("Escreva o texto do novo Fato para Evoluir."); continue; }
      novoXP -= 3;
      const fatos2 = updates["system.fatos"] ?? foundry.utils.deepClone(fatos);
      fatos2.push({ id: foundry.utils.randomID(), texto, rompido: false, predefinido: false });
      updates["system.fatos"] = fatos2;
      mensagens.push(`✨ Evoluiu: novo Fato "<em>${texto}</em>" (−3 XP)`);
    }

    if (acao === "aprimorar") {
      const reservaId = el.querySelector('select[name="aprimorar_reserva"]')?.value ?? "";
      if (novoXP < 3) { ui.notifications.warn("XP insuficiente para Aprimorar (custo: 3 XP)."); continue; }
      const def = reservas.find(r => r.id === reservaId);
      if (!def) continue;
      const max = def.valor_maximo_permitido ?? 6;
      if (def.total >= max) { ui.notifications.warn(`${def.nome} já está no máximo (${max}).`); continue; }
      novoXP -= 3;
      const reservasCopy = foundry.utils.deepClone(system.reservas);
      if (!reservasCopy[reservaId]) reservasCopy[reservaId] = { atual: def.valor_inicial, total: def.valor_inicial };
      reservasCopy[reservaId].total = Math.min(max, reservasCopy[reservaId].total + 1);
      updates["system.reservas"] = reservasCopy;
      mensagens.push(`💪 Aprimorou: <strong>${def.nome}</strong> total ${def.total} → ${def.total + 1} (−3 XP)`);
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
      mensagens.push(`😴 Descansou: <strong>${def.nome}</strong> ${anterior} → ${reservasCopy[reservaId].atual}`);
    }

    if (acao === "mudar") {
      const idx       = parseInt(el.querySelector('select[name="mudar_fato_idx"]')?.value ?? "-1");
      const novoTexto = el.querySelector('input[name="mudar_fato_texto"]')?.value?.trim() ?? "";
      if (!novoTexto) { ui.notifications.warn("Escreva o novo texto do Fato para Mudar."); continue; }
      const fatos2 = updates["system.fatos"] ?? foundry.utils.deepClone(fatos);
      if (fatos2[idx]) {
        const anterior = fatos2[idx].texto;
        fatos2[idx].texto = novoTexto;
        updates["system.fatos"] = fatos2;
        mensagens.push(`✏️ Mudou Fato: "<em>${anterior || "?"}</em>" → "<em>${novoTexto}</em>"`);
      }
    }

    if (acao === "preparar") {
      novoXP += 1;
      mensagens.push("🎯 Preparou-se: +1 XP");
    }
  }

  updates["system.xp.value"] = novoXP;
  await actor.update(updates);

  const resumo = mensagens.length
    ? `<b>Interlúdio de ${actor.name}</b><br>${mensagens.join("<br>")}`
    : `<b>Interlúdio de ${actor.name}</b><br>Descansou sem ações.`;

  await ChatMessage.create({ content: resumo, speaker: ChatMessage.getSpeaker({ actor }) });
}
