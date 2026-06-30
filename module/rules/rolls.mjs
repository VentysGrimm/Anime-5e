const D20_MODE_FORMULAS = {
  normal: "1d20",
  advantage: "2d20kh",
  disadvantage: "2d20kl"
};

const D20_MODE_LABELS = {
  normal: "Normal",
  advantage: "Advantage",
  disadvantage: "Disadvantage"
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function signedModifier(value) {
  const modifier = Number(value) || 0;
  return modifier >= 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`;
}

function formatSignedValue(value) {
  const number = Number(value) || 0;
  return number >= 0 ? `+${number}` : String(number);
}

function normalizeD20Mode(mode) {
  return D20_MODE_FORMULAS[mode] ? mode : "normal";
}

function firstD20Total(roll) {
  const die = roll?.dice?.find((candidate) => candidate.faces === 20);
  return Number.isFinite(Number(die?.total)) ? Number(die.total) : null;
}

export function buildD20Formula(modifiers = [], options = {}) {
  const mode = normalizeD20Mode(options.mode);
  const modifierList = Array.isArray(modifiers) ? modifiers : [modifiers];
  return [D20_MODE_FORMULAS[mode], ...modifierList.map((modifier) => signedModifier(modifier))].join(" ");
}

export function renderRollFlavor({ actor = null, label = "Roll", formula = "", result = "", mode = "normal", details = [] } = {}) {
  const modeKey = normalizeD20Mode(mode);
  const actorName = actor?.name ?? "Anime 5e";
  const detailRows = details
    .filter((detail) => detail?.label && detail.value !== undefined && detail.value !== null && detail.value !== "")
    .map((detail) => `<dt>${escapeHtml(detail.label)}</dt><dd>${escapeHtml(detail.value)}</dd>`)
    .join("");

  return `
    <article class="anime5e chat-card roll-card">
      <h3>${escapeHtml(label)}</h3>
      <dl class="roll-summary">
        <dt>Actor</dt><dd>${escapeHtml(actorName)}</dd>
        <dt>Formula</dt><dd>${escapeHtml(formula)}</dd>
        <dt>Mode</dt><dd>${escapeHtml(D20_MODE_LABELS[modeKey])}</dd>
        <dt>Result</dt><dd>${escapeHtml(result)}</dd>
        ${detailRows}
      </dl>
    </article>
  `;
}

export async function evaluateAnime5eFormula(formula) {
  if (!formula) throw new Error("A roll formula is required.");

  const roll = new Roll(formula);
  await roll.evaluate();
  return roll;
}

export async function rollAnime5eFormula({
  formula,
  actor = null,
  label = "Roll",
  mode = "normal",
  speaker = null,
  details = [],
  targetNumber = null,
  showMargin = false,
  showCritical = false
} = {}) {
  if (!formula) throw new Error("A roll formula is required.");

  const rollMode = normalizeD20Mode(mode);
  const roll = await evaluateAnime5eFormula(formula);
  const resolvedDetails = [...details];
  const hasTarget = targetNumber !== null && targetNumber !== undefined && targetNumber !== "";
  const target = hasTarget ? Number(targetNumber) : NaN;
  if (Number.isFinite(target)) {
    resolvedDetails.push({ label: "Target", value: target });
    if (showMargin) resolvedDetails.push({ label: "Margin", value: formatSignedValue(roll.total - target) });
  }

  if (showCritical) {
    const d20 = firstD20Total(roll);
    if (d20 === 20) resolvedDetails.push({ label: "Critical", value: "Natural 20" });
    if (d20 === 1) resolvedDetails.push({ label: "Critical", value: "Natural 1" });
  }

  return roll.toMessage({
    speaker: speaker ?? (actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker()),
    flavor: renderRollFlavor({
      actor,
      label,
      formula,
      result: roll.total,
      mode: rollMode,
      details: resolvedDetails
    })
  });
}

export async function rollAnime5eD20({ actor = null, label = "D20 Roll", modifiers = [], mode = "normal", speaker = null } = {}) {
  return rollAnime5eFormula({
    actor,
    formula: buildD20Formula(modifiers, { mode }),
    label,
    mode,
    speaker
  });
}
