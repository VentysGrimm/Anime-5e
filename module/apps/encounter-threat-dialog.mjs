const { DialogV2 } = foundry.applications.api;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function numberValue(form, field, fallback = 0) {
  const value = Number(form?.elements?.[field]?.value);
  return Number.isFinite(value) ? value : fallback;
}

function textValue(form, field) {
  return String(form?.elements?.[field]?.value ?? "").trim();
}

function calculateEncounterThreat(form) {
  const partySize = Math.max(0, Math.trunc(numberValue(form, "partySize", 0)));
  const partyLevel = Math.max(1, Math.trunc(numberValue(form, "partyLevel", 1)));
  const creatureCount = Math.max(0, Math.trunc(numberValue(form, "creatureCount", 0)));
  const creatureXp = Math.max(0, Math.trunc(numberValue(form, "creatureXp", 0)));
  const creatureCr = textValue(form, "creatureCr") || "Manual";
  const totalCreatureXp = creatureXp * creatureCount;
  const xpPerCharacter = partySize ? Math.floor(totalCreatureXp / partySize) : 0;
  const warnings = [
    "Encounter Threat formulas are not fully automated yet; use these totals as manual bookkeeping.",
    partySize <= 0 ? "Enter a party size before comparing per-character XP." : null,
    creatureXp <= 0 ? "Enter creature XP from the source actor or stat block to calculate totals." : null,
    creatureCount <= 0 ? "Enter at least one creature." : null
  ].filter(Boolean);

  return {
    partySize,
    partyLevel,
    creatureCount,
    creatureCr,
    creatureXp,
    totalCreatureXp,
    xpPerCharacter,
    warnings
  };
}

function renderEncounterThreatResult(result) {
  return `
    <div class="encounter-threat-result-grid">
      <span>Party <strong>${result.partySize} at Level ${result.partyLevel}</strong></span>
      <span>Creature CR <strong>${escapeHtml(result.creatureCr)}</strong></span>
      <span>Creature XP <strong>${result.creatureXp}</strong></span>
      <span>Creature Count <strong>${result.creatureCount}</strong></span>
      <span>Total Creature XP <strong>${result.totalCreatureXp}</strong></span>
      <span>XP Per Character <strong>${result.xpPerCharacter}</strong></span>
    </div>
    ${result.warnings.map((warning) => `<p class="sheet-warning">${warning}</p>`).join("")}
  `;
}

function renderEncounterThreatContent() {
  return `
    <section class="anime5e encounter-threat-dialog">
      <p>Manual Challenge Rating and Encounter Threat bookkeeping for Core Monsters, Core NPCs, and Core Neomorphs.</p>
      <form class="encounter-threat-form">
        <div class="encounter-threat-grid">
          <label>Party Size <input type="number" name="partySize" value="4" min="1"></label>
          <label>Party Level <input type="number" name="partyLevel" value="1" min="1"></label>
          <label>Creature CR <input type="text" name="creatureCr" value="1/4"></label>
          <label>Creature XP <input type="number" name="creatureXp" value="50" min="0"></label>
          <label>Creature Count <input type="number" name="creatureCount" value="1" min="1"></label>
        </div>
        <button type="button" data-action="calculate-encounter-threat"><i class="fas fa-calculator"></i><span>Calculate</span></button>
      </form>
      <section class="encounter-threat-output" aria-live="polite"></section>
    </section>
  `;
}

export class Anime5eEncounterThreatDialog extends DialogV2 {
  constructor(options = {}) {
    super({
      window: {
        title: "Anime 5e Encounter Threat"
      },
      content: renderEncounterThreatContent(),
      buttons: [
        {
          action: "close",
          label: "Close",
          default: true
        }
      ],
      ...options
    });
  }

  async _onRender(context, options) {
    if (typeof super._onRender === "function") await super._onRender(context, options);

    const element = this.element instanceof HTMLElement ? this.element : this.element?.[0];
    const root = element?.querySelector(".encounter-threat-dialog");
    const form = root?.querySelector(".encounter-threat-form");
    const output = root?.querySelector(".encounter-threat-output");
    if (!form || !output) return;

    const calculate = () => {
      output.innerHTML = renderEncounterThreatResult(calculateEncounterThreat(form));
    };

    root.querySelector("[data-action='calculate-encounter-threat']")?.addEventListener("click", calculate);
    form.querySelectorAll("input").forEach((input) => {
      input.addEventListener("change", calculate);
      input.addEventListener("input", calculate);
    });
    calculate();
  }
}

export function showEncounterThreatDialog() {
  return new Anime5eEncounterThreatDialog().render({ force: true });
}
