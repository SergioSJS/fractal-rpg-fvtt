import { rolagemDeRisco, aplicarRupturas } from "./roll.mjs";
import { createRollMessage, updateRollMessageRupturas } from "./chat.mjs";

const { DialogV2 } = foundry.applications.api;

export async function openRollDialog(actor, selectedIds = [], onClose = null) {
  const fatos      = actor.system.fatos;
  const selecionados = new Set(selectedIds);

  const fatosHtml = fatos.length
    ? fatos.map(f => {
        const disabled = f.rompido ? "disabled" : "";
        const checked  = selecionados.has(f.id) ? "checked" : "";
        const cls      = f.rompido ? " rompido" : (selecionados.has(f.id) ? " selecionado" : "");
        return `<label class="fato-check-row${cls}">
          <input type="checkbox" name="fato" value="${f.id}" ${checked} ${disabled} />
          <span>${f.texto || "<em>(Fato sem nome)</em>"}</span>
          ${f.rompido ? '<span class="badge-rompido">💥 rompido</span>' : ""}
        </label>`;
      }).join("")
    : '<p class="no-fatos">Nenhum Fato disponível. Você rolará 1d6 (sucesso apenas no 6).</p>';

  const content = `
<div class="fractal-roll-dialog">
  <div class="roll-field">
    <label>Descreva a ação</label>
    <input type="text" id="roll-acao" placeholder="O que você está tentando fazer?" />
  </div>
  <div class="roll-field">
    <div class="fatos-header">
      <label>Fatos aplicáveis</label>
      <span class="fatos-hint-small">máx 3 (ou 4 com Vantagem)</span>
    </div>
    <div class="fatos-checkboxes">${fatosHtml}</div>
  </div>
  <div class="roll-field vantagem-row">
    <label><input type="checkbox" id="roll-vantagem" /> Vantagem <span class="vantagem-hint">(posição favorável ou ajuda de aliado)</span></label>
  </div>
  <div class="roll-preview-bar">
    Dados a rolar: <span id="roll-preview"><strong>1d6</strong> — sucesso só no 6</span>
  </div>
</div>`;

  await DialogV2.wait({
    window:      { title: "Rolagem de Risco" },
    position:    { width: 520 },
    content,
    rejectClose: false,
    render:      (_ev, app) => _setupPreview(app.element),
    buttons: [
      {
        action:   "rolar",
        label:    "Rolar",
        icon:     "fas fa-dice-d6",
        default:  true,
        callback: async (_ev, _btn, dialog) => {
          const el         = dialog.element;
          const acao       = el.querySelector("#roll-acao")?.value?.trim() ?? "";
          const fatosIds   = [...el.querySelectorAll('input[name="fato"]:checked')].map(i => i.value);
          const vantagem   = el.querySelector("#roll-vantagem")?.checked ?? false;
          const fatosNomes = fatos.filter(f => fatosIds.includes(f.id)).map(f => f.texto || "(sem nome)");

          const resultado = await rolagemDeRisco(actor, fatosIds, vantagem);

          // 1. Postar resultado no chat imediatamente
          const { msg, templateData } = await createRollMessage(actor, resultado, acao, fatosNomes);

          // 2. Só depois abrir modal de ruptura
          if (resultado.rupturas > 0 && fatosIds.length > 0) {
            const usados = fatos.filter(f => fatosIds.includes(f.id) && !f.rompido);
            if (usados.length > 0) {
              const fatosRompidos = await _escolherRupturas(actor, usados, resultado.rupturas);
              // 3. Atualizar mensagem do chat com os fatos rompidos escolhidos
              await updateRollMessageRupturas(msg, templateData, fatosRompidos);
            }
          }

          onClose?.();
        },
      },
      {
        action:   "cancelar",
        label:    "Cancelar",
        callback: () => onClose?.(),
      },
    ],
  });
}

function _setupPreview(el) {
  const update = () => {
    const checked = [...el.querySelectorAll('input[name="fato"]:checked')];
    const n    = checked.length;
    const vant = el.querySelector("#roll-vantagem")?.checked ?? false;
    const sem  = n === 0;
    let qtd    = sem ? 1 : Math.min(n, 3);
    if (vant && !sem) qtd = Math.min(qtd + 1, 4);
    const preview = el.querySelector("#roll-preview");
    if (preview) preview.innerHTML = `<strong>${qtd}d6</strong>${sem ? " — sucesso só no 6" : ""}`;
    el.querySelectorAll('input[name="fato"]:not(:checked):not([disabled])').forEach(i => {
      i.disabled = !vant && checked.length >= 3;
    });
    el.querySelectorAll('input[name="fato"]:checked').forEach(i => { i.disabled = false; });
  };
  update();
  el.addEventListener("change", e => { if (e.target.matches('input[type="checkbox"]')) update(); });
}

async function _escolherRupturas(actor, fatosUsados, qtdRupturas) {
  const max = Math.min(qtdRupturas, fatosUsados.length);
  const opcoesHtml = fatosUsados.map(f =>
    `<label class="fato-check-row">
      <input type="checkbox" name="romper" value="${f.id}" />
      <span>${f.texto || "(Fato sem nome)"}</span>
    </label>`
  ).join("");

  const content = `
<div class="fractal-roll-dialog">
  <p style="margin:0 0 8px;font-size:12px;color:#b71c1c;font-weight:600;">
    💥 ${max} Ruptura${max > 1 ? "s" : ""} — escolha qual${max > 1 ? "is Fatos rompem" : " Fato rompe"}:
  </p>
  <div class="fatos-checkboxes" id="ruptura-lista">${opcoesHtml}</div>
  <p id="ruptura-aviso" style="font-size:11px;color:#999;margin:4px 0 0;"></p>
</div>`;

  let escolhidos = [];

  await DialogV2.wait({
    window:      { title: "Ruptura" },
    position:    { width: 520 },
    content,
    rejectClose: false,
    render:      (_ev, app) => {
      const el = app.element;
      const update = () => {
        const checked = [...el.querySelectorAll('input[name="romper"]:checked')];
        const aviso   = el.querySelector("#ruptura-aviso");
        if (aviso) aviso.textContent = checked.length >= max
          ? `${checked.length}/${max} selecionados — máximo atingido`
          : `${checked.length}/${max} selecionados`;
        el.querySelectorAll('input[name="romper"]:not(:checked)').forEach(i => {
          i.disabled = checked.length >= max;
        });
        el.querySelectorAll('input[name="romper"]:checked').forEach(i => { i.disabled = false; });
      };
      update();
      el.addEventListener("change", e => { if (e.target.matches('input[name="romper"]')) update(); });
    },
    buttons: [
      {
        action:   "confirmar",
        label:    "Confirmar",
        default:  true,
        callback: (_ev, _btn, dialog) => {
          escolhidos = [...dialog.element.querySelectorAll('input[name="romper"]:checked')].map(i => i.value);
        },
      },
      {
        action:   "pular",
        label:    "Pular",
        callback: () => {},
      },
    ],
  });

  return aplicarRupturas(actor, escolhidos);
}
