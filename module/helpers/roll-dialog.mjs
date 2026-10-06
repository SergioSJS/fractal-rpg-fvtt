import { rolagemDeRisco, aplicarRupturas } from "./roll.mjs";
import { createRollMessage, updateRollMessageRupturas } from "./chat.mjs";
import { MAX_FATOS, quantidadeDeDados } from "../rules/risco.mjs";

const { DialogV2 } = foundry.applications.api;

const esc = foundry.utils.escapeHTML;
const t   = (key, data) => data ? game.i18n.format(key, data) : game.i18n.localize(key);

export async function openRollDialog(actor, selectedIds = [], onClose = null) {
  const fatos      = actor.system.fatos;
  const selecionados = new Set(selectedIds);
  const semNome    = t("FRACTAL.Comum.FatoSemNome");

  const fatosHtml = fatos.length
    ? fatos.map(f => {
        const disabled = f.rompido ? "disabled" : "";
        const checked  = selecionados.has(f.id) ? "checked" : "";
        const cls      = f.rompido ? " rompido" : (selecionados.has(f.id) ? " selecionado" : "");
        return `<label class="fato-check-row${cls}">
          <input type="checkbox" name="fato" value="${f.id}" ${checked} ${disabled} />
          <span>${f.texto ? esc(f.texto) : `<em>${semNome}</em>`}</span>
          ${f.rompido ? `<span class="badge-rompido">${t("FRACTAL.Roll.BadgeQuebrado")}</span>` : ""}
        </label>`;
      }).join("")
    : `<p class="no-fatos">${t("FRACTAL.Roll.SemFatosDisponiveis")}</p>`;

  const content = `
<div class="fractal-roll-dialog">
  <div class="roll-field">
    <label>${t("FRACTAL.Roll.Acao")}</label>
    <input type="text" id="roll-acao" placeholder="${t("FRACTAL.Roll.AcaoPh")}" />
  </div>
  <div class="roll-field">
    <div class="fatos-header">
      <label>${t("FRACTAL.Roll.FatosAplicaveis")}</label>
      <span class="fatos-hint-small">${t("FRACTAL.Roll.LimiteFatos", { max: MAX_FATOS })}</span>
    </div>
    <div class="fatos-checkboxes">${fatosHtml}</div>
  </div>
  <div class="roll-field vantagem-row">
    <label><input type="checkbox" id="roll-vantagem" /> ${t("FRACTAL.Roll.Vantagem")} <span class="vantagem-hint">${t("FRACTAL.Roll.VantagemDica")}</span></label>
  </div>
  <div class="roll-preview-bar">
    ${t("FRACTAL.Roll.DadosARolar")} <span id="roll-preview"><strong>1d6</strong>${t("FRACTAL.Roll.SoNo6")}</span>
  </div>
</div>`;

  await DialogV2.wait({
    classes:     ["fractal-rpg"],
    window:      { title: "FRACTAL.Roll.Titulo" },
    position:    { width: 520 },
    content,
    rejectClose: false,
    render:      (_ev, app) => _setupPreview(app.element),
    buttons: [
      {
        action:   "rolar",
        label:    "FRACTAL.Roll.Rolar",
        icon:     "fas fa-dice-d6",
        default:  true,
        callback: async (_ev, _btn, dialog) => {
          const el         = dialog.element;
          const acao       = el.querySelector("#roll-acao")?.value?.trim() ?? "";
          const fatosIds   = [...el.querySelectorAll('input[name="fato"]:checked')].map(i => i.value);
          const vantagem   = el.querySelector("#roll-vantagem")?.checked ?? false;
          const fatosNomes = fatos.filter(f => fatosIds.includes(f.id)).map(f => f.texto || semNome);

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
        label:    "FRACTAL.Comum.Cancelar",
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
    const qtd  = quantidadeDeDados(n, vant);
    const preview = el.querySelector("#roll-preview");
    if (preview) preview.innerHTML = `<strong>${qtd}d6</strong>${n === 0 ? t("FRACTAL.Roll.SoNo6") : ""}`;
    el.querySelectorAll('input[name="fato"]:not(:checked)').forEach(i => {
      if (i.closest(".fato-check-row")?.classList.contains("rompido")) return;
      i.disabled = n >= MAX_FATOS;
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
      <span>${esc(f.texto || t("FRACTAL.Comum.FatoSemNome"))}</span>
    </label>`
  ).join("");

  const aviso = max > 1
    ? t("FRACTAL.Ruptura.EscolhaVarias", { n: max })
    : t("FRACTAL.Ruptura.EscolhaUma");
  const content = `
<div class="fractal-roll-dialog">
  <p class="ruptura-warning">${aviso}</p>
  <div class="fatos-checkboxes" id="ruptura-lista">${opcoesHtml}</div>
  <p id="ruptura-aviso" class="ruptura-aviso"></p>
</div>`;

  let escolhidos = [];

  await DialogV2.wait({
    classes:     ["fractal-rpg"],
    window:      { title: "FRACTAL.Ruptura.Titulo" },
    position:    { width: 520 },
    content,
    rejectClose: false,
    render:      (_ev, app) => {
      const el = app.element;
      const update = () => {
        const checked = [...el.querySelectorAll('input[name="romper"]:checked')];
        const aviso   = el.querySelector("#ruptura-aviso");
        if (aviso) aviso.textContent = t(
          checked.length >= max ? "FRACTAL.Ruptura.ContadorMax" : "FRACTAL.Ruptura.Contador",
          { n: checked.length, max },
        );
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
        label:    "FRACTAL.Comum.Confirmar",
        default:  true,
        callback: (_ev, _btn, dialog) => {
          escolhidos = [...dialog.element.querySelectorAll('input[name="romper"]:checked')].map(i => i.value);
        },
      },
      {
        action:   "pular",
        label:    "FRACTAL.Ruptura.Pular",
        callback: () => {},
      },
    ],
  });

  return aplicarRupturas(actor, escolhidos);
}
