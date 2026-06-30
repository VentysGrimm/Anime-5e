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

function parseChallengeRating(value) {
  const text = String(value ?? "").trim();
  if (!text) return 0;
  const fraction = text.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    return denominator ? numerator / denominator : 0;
  }

  const number = Number(text);
  return Number.isFinite(number) ? number : 0;
}

function formatThreat(value) {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function compareThreat(partyThreat, encounterThreat) {
  if (partyThreat <= 0 && encounterThreat <= 0) return "Enter party and encounter threat";
  if (partyThreat <= 0) return `Encounter leads by ${formatThreat(encounterThreat)}`;
  if (encounterThreat <= 0) return `Party leads by ${formatThreat(partyThreat)}`;
  const delta = encounterThreat - partyThreat;
  if (Math.abs(delta) < 0.01) return "Even threat";
  return delta > 0
    ? `Encounter leads by ${formatThreat(delta)}`
    : `Party leads by ${formatThreat(Math.abs(delta))}`;
}

function calculateEncounterThreat(form) {
  const partySize = Math.max(0, Math.trunc(numberValue(form, "partySize", 0)));
  const partyLevel = Math.max(1, Math.trunc(numberValue(form, "partyLevel", 1)));
  const partyThreatOverride = Math.max(0, numberValue(form, "partyThreatOverride", 0));
  const partyXpBudget = Math.max(0, Math.trunc(numberValue(form, "partyXpBudget", 0)));
  const creatureCount = Math.max(0, Math.trunc(numberValue(form, "creatureCount", 0)));
  const creatureXp = Math.max(0, Math.trunc(numberValue(form, "creatureXp", 0)));
  const creatureCr = textValue(form, "creatureCr") || "Manual";
  const encounterThreatOverride = Math.max(0, numberValue(form, "encounterThreatOverride", 0));
  const numericCr = parseChallengeRating(creatureCr);
  const derivedPartyThreat = partySize * partyLevel;
  const derivedEncounterThreat = numericCr * creatureCount;
  const partyThreat = partyThreatOverride || derivedPartyThreat;
  const encounterThreat = encounterThreatOverride || derivedEncounterThreat;
  const totalCreatureXp = creatureXp * creatureCount;
  const xpPerCharacter = partySize ? Math.floor(totalCreatureXp / partySize) : 0;
  const xpDelta = partyXpBudget ? partyXpBudget - totalCreatureXp : null;
  const warnings = [
    "Encounter Threat uses manual values when entered; derived threat is party size x level versus numeric CR x creature count.",
    partySize <= 0 ? "Enter a party size before comparing per-character XP." : null,
    numericCr <= 0 && !encounterThreatOverride ? "Enter a numeric CR such as 1/4 or set an encounter threat override." : null,
    creatureXp <= 0 ? "Enter creature XP from the source actor or stat block to calculate totals." : null,
    creatureCount <= 0 ? "Enter at least one creature." : null
  ].filter(Boolean);

  return {
    partySize,
    partyLevel,
    partyThreat,
    partyThreatSource: partyThreatOverride ? "Manual" : "Derived",
    partyXpBudget,
    creatureCount,
    creatureCr,
    creatureXp,
    encounterThreat,
    encounterThreatSource: encounterThreatOverride ? "Manual" : "Derived",
    totalCreatureXp,
    xpPerCharacter,
    threatComparison: compareThreat(partyThreat, encounterThreat),
    xpDelta,
    warnings
  };
}

function renderEncounterThreatResult(result) {
  return `
    <div class="encounter-threat-result-grid">
      <span>Party <strong>${result.partySize} at Level ${result.partyLevel}</strong></span>
      <span>Creature CR <strong>${escapeHtml(result.creatureCr)}</strong></span>
      <span>Party Threat <strong>${formatThreat(result.partyThreat)} (${result.partyThreatSource})</strong></span>
      <span>Encounter Threat <strong>${formatThreat(result.encounterThreat)} (${result.encounterThreatSource})</strong></span>
      <span>Threat Compare <strong>${escapeHtml(result.threatComparison)}</strong></span>
      <span>Creature XP <strong>${result.creatureXp}</strong></span>
      <span>Creature Count <strong>${result.creatureCount}</strong></span>
      <span>Total Creature XP <strong>${result.totalCreatureXp}</strong></span>
      <span>XP Per Character <strong>${result.xpPerCharacter}</strong></span>
      <span>Party XP Budget <strong>${result.partyXpBudget || "Manual"}</strong></span>
      <span>XP Delta <strong>${result.xpDelta === null ? "Manual" : result.xpDelta}</strong></span>
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
          <label>Party Threat Override <input type="number" name="partyThreatOverride" value="0" min="0" step="0.25"></label>
          <label>Party XP Budget <input type="number" name="partyXpBudget" value="0" min="0"></label>
          <label>Creature CR <input type="text" name="creatureCr" value="1/4"></label>
          <label>Creature XP <input type="number" name="creatureXp" value="50" min="0"></label>
          <label>Creature Count <input type="number" name="creatureCount" value="1" min="1"></label>
          <label>Encounter Threat Override <input type="number" name="encounterThreatOverride" value="0" min="0" step="0.25"></label>
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
